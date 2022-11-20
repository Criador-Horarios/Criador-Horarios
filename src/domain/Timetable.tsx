import Comparable, { Comparables } from './Comparable'
import Shift, { ShiftType, shortenDescriptions } from './Shift'

import i18next from 'i18next'
import SavedStateHandler, { ShiftState } from '../utils/saved-state-handler'
import Course from './Course'
import { staticData } from '../utils/api'

export default class Timetable implements Comparable {
	name: string
	shiftState: ShiftState = { availableShifts: [], selectedShifts: [] }
	private degreeAcronyms: Set<string> = new Set()
	isSaved: boolean // TODO remove
	private isMultiShift: boolean
	private academicTerm: string
	// Not stored
	isImported = false // TODO remove
	private courses: Set<Course> = new Set()
	errors = ''
	// { degree: { course : { shiftType: Set<string> }}}
	currDegreeCourseShifts: Record<string, Record<string, Record<ShiftType, Set<string>>>> = {}
	// { degree: Set<string>(Courses) }
	private shownCourses: Record<string, Set<string>> = {}

	constructor(name: string, shifts: Shift[], isSaved: boolean, isMultishift: boolean, academicTerm: string) {
		this.name = name
		this.shiftState.selectedShifts = shifts
		this.isSaved = isSaved
		this.isMultiShift = isMultishift
		this.academicTerm = academicTerm
		shifts.forEach(s => {
			const degreeAcronym = '' // TODO s.course.degreeAcronym
			const courses = this.currDegreeCourseShifts[degreeAcronym] = this.currDegreeCourseShifts[degreeAcronym] || {}
			const courseId = s.courseId
			this.shownCourses[degreeAcronym] = this.shownCourses[degreeAcronym] || new Set()
			this.shownCourses[degreeAcronym].add(courseId)
			const shifts = courses[courseId] = courses[courseId] || {}
			const shiftType = s.type
			const shiftTypes = shifts[shiftType] = shifts[shiftType] || new Set<string>()
			shiftTypes.add(s.name)
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
				await SavedStateHandler.getInstance().getShifts(parsedStr.shifts, Array.from(degreesAcronyms), parsedStr.academicTerm)
			if (!savedState) return undefined

			const [courses, shiftState, errors] = savedState
			const newTimetable = new Timetable(
				parsedStr.name, shiftState.selectedShifts, parsedStr.isSaved,
				((parsedStr.isMultishift || 'false') === 'true'), parsedStr.academicTerm
			)
			newTimetable.courses = new Set(courses)
			newTimetable.degreeAcronyms = degreesAcronyms
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
	getShownCourseIds(): Record<string, Set<string>> {
		return this.shownCourses
	}

	// Returns a Record with the courseId and the shiftTypes selected for the course
	getCoursesWithShiftTypes(): Record<string, Record<ShiftType, boolean>> {
		const coursesShifts = Object.values(this.currDegreeCourseShifts)
		const res: Record<string, Record<ShiftType, boolean>> = {}
		// Object.values(this.shownCourses).reduce((acc, newSet) => {
		// 	Array.from(newSet).forEach(courseId => acc[courseId] = {} as Record<ShiftType, boolean>)
		// 	return acc
		// }, {} as Record<string, Record<ShiftType, boolean>>)

		coursesShifts.forEach(record =>
			Object.entries(record)
				.forEach(([courseId, shiftTypeRecord]) => {
					res[courseId] = res[courseId] || {}
					Object.keys(shiftTypeRecord).forEach((type) => (res[courseId][type as ShiftType] = true))
				})
		)
		return res
	}

	// =================
	// Shifts management
	/**
	 * Toggles a shift.
	 * If the shift is selected, it deselects it.
	 * If the shift is not selected, it selects it, while also deselecting the shifts
	 * of the same course and type if multishift is disabled.
	 * @param chosenShift The shift to toggle
	 * @returns A new instance of Timetable with the changes.
	 */
	toggleShift(chosenShift: Shift): Timetable {
		const idx = Comparables.indexOf(this.shiftState.selectedShifts, chosenShift)

		let replacingIndex: number
		if (this.isMultiShift) {
			// We want to allow multiple shifts of the same type, don't replace anything
			replacingIndex = -1
		} else {
			// Verify if of the same type and course to replace, but not the same
			replacingIndex = Comparables.indexOfBy(this.shiftState.selectedShifts, chosenShift, Shift.isSameCourseAndType)
		}

		const newSelectedShifts: Shift[] = [...this.shiftState.selectedShifts]
		if (idx === -1) {
			newSelectedShifts.push(chosenShift)
			if (replacingIndex !== -1) {
				newSelectedShifts.splice(replacingIndex, 1)
			}
		} else {
			newSelectedShifts.splice(idx, 1)
		}
		
		const newTimetable = this.shallowCopy()
		newTimetable.shiftState = {...this.shiftState, selectedShifts: newSelectedShifts}
		return newTimetable
	}

	getSelectedShiftIds(): string[] {
		return Object.values(this.currDegreeCourseShifts) // Degrees
			.map(r => Object.values(r)).flat() // Course
			.map(st => Object.values(st)).flat() // Shift Types
			.map(set => Array.from(set.values())).flat() // Shifts
	}

	// =================
	/**
	 * @returns The name of this timetable
	 */
	getName() : string {
		return this.name
	}

	/**
	 * @returns The available shifts for this timetable
	 */
	getAvailableShifts(): Shift[] {
		return this.shiftState.availableShifts
	}

	/**
	 * Immutably sets the available shifts for this timetable,
	 * returning a new instance of Timetable.
	 * @param shifts The shifts to set as available.
	 * @returns A new instance of Timetable with the changes.
	 */
	setAvailableShifts(shifts: Shift[]): Timetable {
		const newTimetable = this.shallowCopy()
		newTimetable.shiftState = {...this.shiftState, availableShifts: shifts}
		return newTimetable
	}

	/**
	 * @returns The selected shifts for this timetable
	 */
	getSelectedShifts(): Shift[] {
		return this.shiftState.selectedShifts
	}

	/**
	 * Immutably sets the selected shifts for this timetable,
	 * returning a new instance of Timetable.
	 * @param shifts The shifts to set as selected.
	 * @returns A new instance of Timetable with the changes.
	 */
	setSelectedShifts(shifts: Shift[]): Timetable {
		const newTimetable = this.shallowCopy()
		newTimetable.shiftState = {...this.shiftState, selectedShifts: shifts}
		return newTimetable
	}

	/**
	 * @returns A list of degree acronyms
	 */
	getDegreeAcronyms(): string[] {
		return Array.from(this.degreeAcronyms)
	}

	/**
	 * Immutably sets the degree acronyms for this timetable,
	 * returning a new instance of Timetable.
	 * @param degreeAcronyms A list of degree acronyms.
	 * @returns A new instance of Timetable with the changes.
	 */
	setDegreeAcronyms(degreeAcronyms: string[]): Timetable {
		const newTimetable = this.shallowCopy()
		newTimetable.degreeAcronyms = new Set(degreeAcronyms)
		return newTimetable
	}

	/**
	 * @returns True if multishift mode is enabled, false otherwise.
	 */
	isMultiShiftMode(): boolean {
		return this.isMultiShift
	}

	/**
	 * Immutably sets the multishift mode for this timetable,
	 * returning a new instance of Timetable.
	 * @param mode true to enable multishift, false otherwise.
	 * @returns A new instance of Timetable with the changes.
	 */
	setMultiShiftMode(mode: boolean): Timetable {
		const newTimetable = this.shallowCopy()
		newTimetable.isMultiShift = mode
		return newTimetable
	}

	/**
	 * @returns The academic term (as string) for this timetable
	 */
	getAcademicTerm(): string {
		return this.academicTerm
	}

	/**
	 * Changes the academic term of this Timetable to the one given,
	 * but only if the Timetable does not have an academic term already.
	 * @param academicTerm The new academic term
	 * @returns A new instance of Timetable with the changes, if applicable.
	 */
	setAcademicTerm(academicTerm: string): Timetable {
		if (this.academicTerm === '') {
			const newTimetable = this.shallowCopy()
			newTimetable.academicTerm = academicTerm
			return newTimetable
		}
		return this
	}

	/**
	 * @returns A list of courses present in available shifts of this timetable
	 */
	getCourses(): Course[] {
		return Array.from(this.courses)
	}

	/**
	 * Immutably sets the available courses for this timetable,
	 * returning a new instance of Timetable.
	 * @param courses A list of courses.
	 * @returns A new instance of Timetable with the changes.
	 */
	setCourses(courses: Course[]): Timetable {
		const newTimetable = this.shallowCopy()
		newTimetable.courses = new Set(courses)
		return newTimetable
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
	
	/**
	 * We're aiming to keep this class immutable, so we need this method
	 * for internal usage in setters.
	 */
	private shallowCopy() : Timetable {
		const newTimetable = new Timetable(
			this.name,
			[],
			this.isSaved,
			this.isMultiShift,
			this.academicTerm
		)
		newTimetable.shiftState = this.shiftState
		newTimetable.degreeAcronyms = this.degreeAcronyms
		newTimetable.isImported = this.isImported
		newTimetable.courses = this.courses
		newTimetable.errors = this.errors
		newTimetable.currDegreeCourseShifts = this.currDegreeCourseShifts
		newTimetable.shownCourses = this.shownCourses
		return newTimetable
	}
}

export enum CourseChangeType {
	Add,
	Remove,
	Clear
}

export type CourseChange = {
	type: CourseChangeType
	courseId?: string
}