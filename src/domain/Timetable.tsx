import Comparable, { Comparables } from './Comparable'
import Shift, { shortenDescriptions } from './Shift'

import i18next from 'i18next'
import SavedStateHandler, { ShiftState } from '../utils/saved-state-handler'
import Course from './Course'
import CourseUpdates from '../utils/CourseUpdate'

export default class Timetable implements Comparable {
	name: string
	shiftState: ShiftState = { 	availableShifts: [], selectedShifts: [] }
	degreeAcronyms: Set<string> = new Set()
	isSaved: boolean
	isMultiShift: boolean
	academicTerm: string
	// Not stored
	isImported = false
	courses: Set<Course> = new Set()
	courseUpdates: CourseUpdates = new CourseUpdates()
	errors = ''

	constructor(name: string, shifts: Shift[], isSaved: boolean, isMultishift: boolean, academicTerm: string) {
		this.name = name
		this.shiftState.selectedShifts = shifts
		this.isSaved = isSaved
		this.isMultiShift = isMultishift
		this.academicTerm = academicTerm
	}

	static async fromString(str: string, isImported = false): Promise<Timetable | undefined> {
		try {
			const parsedStr = JSON.parse(str)
			const degreesAcronyms: Set<string> = new Set(parsedStr.degrees?.split(SavedStateHandler.PARAMS_SEP))
			const savedState = await SavedStateHandler.getInstance().getShifts(parsedStr.shifts, degreesAcronyms)
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
			SavedStateHandler.URL_DEGREES, SavedStateHandler.URL_IS_MULTISHIFT
		]

		// Check if needed params are there
		if (neededParams.filter(k => urlParams[k] !== undefined).length !== neededParams.length) return undefined

		const objToParse = {
			name: decodeURI(urlParams[SavedStateHandler.URL_TIMETABLE_NAME]), // Decode for utf-8 characters
			degrees: urlParams[SavedStateHandler.URL_DEGREES],
			shifts: urlParams[SavedStateHandler.URL_SHIFTS],
			isSaved: false,
			isMultishift: urlParams[SavedStateHandler.URL_IS_MULTISHIFT]
		}
		return Timetable.fromString(JSON.stringify(objToParse), true)
	}

	getDisplayName(): string {
		if (this.isImported) return this.name
		return this.isSaved ? this.name : `${i18next.t('add')}: “${this.name}”`
	}

	toggleShift(chosenShift: Shift): void {
		const idx = Comparables.indexOf(this.shiftState.selectedShifts, chosenShift)
		// if (idx !== -1 && !multiShiftMode) return
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
	}

	// Returns true if any shifts were cleared, false otherwise
	clearAllShifts(): boolean {
		if (this.shiftState.selectedShifts.length === 0) return false
		this.courseUpdates.courses.forEach(c => c.clearSelectedShifts())
		this.shiftState.selectedShifts = []
		return true
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
		// FIXME: Missing academic term
		const shifts = shortenDescriptions(this.shiftState.selectedShifts)
		const degrees = this.getDegreesString()?.join(SavedStateHandler.PARAMS_SEP)
		const isMultishift = this.isMultiShift.toString()
		return [
			`${SavedStateHandler.URL_TIMETABLE_NAME}=${encodeURI(this.name)}`,
			`${SavedStateHandler.URL_SHIFTS}=${shifts}`,
			`${SavedStateHandler.URL_DEGREES}=${degrees}`,
			`${SavedStateHandler.URL_IS_MULTISHIFT}=${isMultishift}`
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
}