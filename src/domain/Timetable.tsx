import Comparable, { Comparables } from './Comparable'
import Shift, { ShiftRef, ShiftType, shortenDescriptions } from './Shift'

import i18next from 'i18next'
import SavedStateHandler, { ShiftState } from '../utils/saved-state-handler'
import Course from './Course'
import CourseUpdates from '../utils/CourseUpdate'
import { staticData } from '../utils/api'

export default class Timetable implements Comparable {
	name: string
	shiftState: ShiftState = { availableShifts: [], selectedShifts: [] }
	degreeAcronyms: Set<string> = new Set()
	isSaved: boolean
	isMultiShift: boolean
	academicTerm: string
	// Not stored
	isImported = false
	courses: Set<Course> = new Set()
	courseUpdates: CourseUpdates = new CourseUpdates()
	errors = ''
	// { degree: { course : { shiftType: Set<string> }}}
	currDegreeCourseShifts: Record<string, Record<string, Record<ShiftType, Set<string>>>> = {}
	shiftRefs: Record<string, ShiftRef> = {}
	// { degree: Set<string>(Courses) }
	private shownCourses: Record<string, Set<string>> = {}

	constructor(name: string, shifts: Shift[], isSaved: boolean, isMultishift: boolean, academicTerm: string) {
		this.name = name
		this.shiftState.selectedShifts = shifts
		this.isSaved = isSaved
		this.isMultiShift = isMultishift
		this.academicTerm = academicTerm
		shifts.forEach(s => {
			const degreeAcronym = s.course.degreeAcronym
			const courses = this.currDegreeCourseShifts[degreeAcronym] = this.currDegreeCourseShifts[degreeAcronym] || {}
			const courseId = s.courseId
			this.shownCourses[degreeAcronym] = this.shownCourses[degreeAcronym] || new Set()
			this.shownCourses[degreeAcronym].add(courseId)
			const shifts = courses[courseId] = courses[courseId] || {}
			const shiftType = s.type
			const shiftTypes = shifts[shiftType] = shifts[shiftType] || new Set<string>()
			const storingShift: ShiftRef = { courseId: s.courseId, type: s.type, id: s.shiftId, fullId: s.name }
			shiftTypes.add(s.name)
			this.shiftRefs[s.name] = storingShift
		})

		if (academicTerm === '' || academicTerm === undefined) {
			this.academicTerm = staticData.currentTerm?.id || ''
		}
	}

	static async fromString(str: string, isImported = false): Promise<Timetable | undefined> {
		try {
			const parsedStr = JSON.parse(str)
			const degreesAcronyms: Set<string> = new Set(parsedStr.degrees?.split(SavedStateHandler.PARAMS_SEP))
			const savedState =
				await SavedStateHandler.getInstance().getShifts(parsedStr.shifts, degreesAcronyms, parsedStr.academicTerm)
			if (!savedState) return undefined

			const [courseUpdate, shiftState, errors] = savedState
			const newTimetable = new Timetable(
				parsedStr.name, shiftState.selectedShifts, parsedStr.isSaved,
				((parsedStr.isMultishift || 'false') === 'true'), parsedStr.academicTerm
			)
			newTimetable.courses = new Set(courseUpdate.courses)
			newTimetable.degreeAcronyms = degreesAcronyms
			// Stored for current usage, not kept in storage
			newTimetable.courseUpdates = courseUpdate
			newTimetable.shiftState = shiftState
			newTimetable.errors = errors
			newTimetable.isImported = isImported
			return newTimetable
		} catch (err) {
			// Baaaaah
			console.error(err)
			return undefined
		}
	}

	static async fromURLParams(urlParams: Record<string, string>): Promise<Timetable | undefined> {
		const neededParams = [
			SavedStateHandler.URL_TIMETABLE_NAME, SavedStateHandler.URL_SHIFTS,
			SavedStateHandler.URL_DEGREES, SavedStateHandler.URL_IS_MULTISHIFT,
			SavedStateHandler.URL_TERM
		]

		// Check if needed params are there
		if (neededParams.filter(k => urlParams[k] !== undefined).length !== neededParams.length) return undefined

		const objToParse = {
			name: decodeURI(urlParams[SavedStateHandler.URL_TIMETABLE_NAME]), // Decode for utf-8 characters
			degrees: urlParams[SavedStateHandler.URL_DEGREES],
			shifts: urlParams[SavedStateHandler.URL_SHIFTS],
			isSaved: false,
			isMultishift: urlParams[SavedStateHandler.URL_IS_MULTISHIFT],
			academicTerm: decodeURI(urlParams[SavedStateHandler.URL_TERM])
		}
		return Timetable.fromString(JSON.stringify(objToParse), true)
	}

	getDisplayName(): string {
		if (this.isImported) return this.name
		return this.isSaved ? this.name : `${i18next.t('add')}: “${this.name}”`
	}

	// =================
	// Courses management
	toggleCourse(courses: Course[]): void {
		// There are no courses to be shown, so 
		Object.values(this.shownCourses).forEach(set => set.clear())
		if (courses.length === 0) {
			return
		}

		// Mark to show the courses
		courses.forEach(course => this.shownCourses[course.degreeAcronym].add(course.id))
	}

	getShownCourseIds(): Record<string, Set<string>> {
		return this.shownCourses
	}

	// =================
	// Shifts management
	toggleShift(chosenShift: Shift): void {
		const idx = Comparables.indexOf(this.shiftState.selectedShifts, chosenShift)
		const shiftCourse = this.courseUpdates.courses.filter(c => c.id === chosenShift.courseId)

		let replacingIndex
		if (this.isMultiShift) {
			// We want to allow multiple shifts of the same type, don't replace anything
			replacingIndex = -1
		} else {
			// Verify if of the same type and course to replace, but not the same
			replacingIndex = Comparables.indexOfBy(this.shiftState.selectedShifts, chosenShift, Shift.isSameCourseAndType)
		}

		if (idx === -1) {
			// Add course if not existing
			if (!this.courseUpdates.has(chosenShift.course)) this.courseUpdates.toggleCourse(chosenShift.course)
			
			this.shiftState.selectedShifts.push(chosenShift)
			if (replacingIndex !== -1) {
				this.shiftState.selectedShifts.splice(replacingIndex, 1)
			} else if (shiftCourse.length === 1) {
				// Change on the course for the selected shift types
				shiftCourse[0].addSelectedShift(chosenShift)
			}
			this.degreeAcronyms.add(chosenShift.course.degreeAcronym)
		} else {
			this.shiftState.selectedShifts.splice(idx, 1)
			if (shiftCourse.length === 1) {
				// Change on the course for the selected shift types
				shiftCourse[0].removeSelectedShift(chosenShift)
			}
		}

		// -- ShiftRef
		const degreeAcronym = chosenShift.course.degreeAcronym
		const courseId = chosenShift.courseId
		const shiftId = chosenShift.name
		const shiftType = chosenShift.type

		// Check for degree, course and shift types
		const courses = this.currDegreeCourseShifts[degreeAcronym] = this.currDegreeCourseShifts[degreeAcronym] || {}
		const shiftTypes = courses[courseId] = courses[courseId] || {}
		const shifts = shiftTypes[shiftType] = shiftTypes[shiftType] || new Set()

		const storingShift: ShiftRef =
			{ courseId: chosenShift.courseId, type: chosenShift.type, id: chosenShift.shiftId, fullId: chosenShift.name }

		// Has clicked to remove the specific shift of specific type
		if (shifts.has(shiftId)) {
			shifts.delete(shiftId)
			delete this.shiftRefs[shiftId]
			// Clear course if there are no shifts, clear degree if there are no courses, etc...
			if (shifts.size === 0) delete shiftTypes[shiftType]
			if (Object.entries(shiftTypes).length === 0) delete courses[courseId]
			if (Object.entries(courses).length === 0) delete this.currDegreeCourseShifts[degreeAcronym]
		}
		// Has shifts for this type but does not have this specific shift
		else if (shifts.size > 0) {
			// If not multishift, remove the other one
			if (!this.isMultiShift) {
				shifts.forEach(shiftId => delete this.shiftRefs[shiftId])
				shifts.clear()
			}
			shifts.add(shiftId)
			this.shiftRefs[shiftId] = storingShift
		}
		// Does not have shifts for this type, so it is a new one :)
		else {
			shifts.add(shiftId)
			this.shiftRefs[shiftId] = storingShift
		}
	}

	getSelectedShiftIds(): string[] {
		return Object.values(this.currDegreeCourseShifts) // Degrees
			.map(r => Object.values(r)).flat() // Course
			.map(st => Object.values(st)).flat() // Shift Types
			.map(set => Array.from(set.values())).flat() // Shifts
	}

	// Returns true if any shifts were cleared, false otherwise
	clearAllShifts(): boolean {
		// TODO: Check currDegreeCourseShifts
		if (this.shiftState.selectedShifts.length === 0) return false
		this.courseUpdates.courses.forEach(c => c.clearSelectedShifts())
		this.shiftState.selectedShifts = []

		// TODO: ShiftRef
		// Object.keys(this.currDegreeCourseShifts).map((c) => this.currDegreeCourseShifts[c] = {})
		return true
	}

	// =================
	setAcademicTerm(academicTerm: string): void {
		if (this.academicTerm === '') this.academicTerm = academicTerm
	}

	setMultiShiftMode(mode: boolean): void {
		this.isMultiShift = mode
	}

	save(): void {
		this.isImported = false
		this.isSaved = true
	}

	equals(obj: Comparable): boolean {
		// TODO: Implement
		return obj.hashString() === ''
	}

	hashString(): string {
		return ''
	}

	getDegreesString(): string[] | undefined {
		const currDegrees = Array.from(this.degreeAcronyms)
		if (currDegrees.length == 0) return undefined
		return currDegrees.reduce((a, b) => `${a};${b}`).split(SavedStateHandler.PARAMS_SEP)
	}

	toURLParams(): string[] {
		const shifts = shortenDescriptions(this.shiftState.selectedShifts)
		const degrees = this.getDegreesString()?.join(SavedStateHandler.PARAMS_SEP)
		const isMultishift = this.isMultiShift.toString()
		return [
			`${SavedStateHandler.URL_TIMETABLE_NAME}=${encodeURI(this.name)}`,
			`${SavedStateHandler.URL_SHIFTS}=${shifts}`,
			`${SavedStateHandler.URL_DEGREES}=${degrees}`,
			`${SavedStateHandler.URL_IS_MULTISHIFT}=${isMultishift}`,
			`${SavedStateHandler.URL_TERM}=${encodeURI(this.academicTerm)}`,
		]
	}

	toString(): string {
		const obj = {
			name: this.name,
			degrees: this.getDegreesString()?.join(SavedStateHandler.PARAMS_SEP),
			shifts: shortenDescriptions(this.shiftState.selectedShifts),
			isSaved: this.isSaved,
			isMultishift: this.isMultiShift,
			academicTerm: this.academicTerm
		}
		return JSON.stringify(obj)
	}

	deepCopy(): Timetable {
		// Deep copy courses
		const newCourses = [...(Comparables.toUnique(this.courseUpdates.courses) as Course[])].map(c => c.deepCopy()) 
		const coursesById: Record<string, Course> = Array.from(newCourses)
			.reduce((acc, course) => ({ ...acc, [course.id]: course }), {})

		// Deep copy shifts and associate to the new courses
		const availableShifts = this.shiftState.availableShifts.map(s => {
			const newShift = s.deepCopy()
			newShift.course = coursesById[newShift.courseId]
			return newShift
		})
		const selectedShifts = availableShifts.filter(s =>
			this.shiftState.selectedShifts.find(oldS => oldS.name === s.name) !== undefined
		)
		const newTimetable = new Timetable(
			this.name, selectedShifts, false,
			this.isMultiShift, this.academicTerm
		)
		newTimetable.courseUpdates.degreeAcronyms = new Set(this.courseUpdates.degreeAcronyms)
		newTimetable.degreeAcronyms = this.degreeAcronyms
		// Stored for current usage, not kept in storage
		newTimetable.courseUpdates = new CourseUpdates()
		newTimetable.courseUpdates.courses = newCourses
		newTimetable.courses = new Set(newCourses)
		newTimetable.shiftState = { availableShifts, selectedShifts }
		newTimetable.errors = this.errors
		newTimetable.isImported = false
		return newTimetable
	}
}