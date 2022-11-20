import { isOkWithWhite } from './../utils/colors'
import Comparable, { Comparables } from './Comparable'
import Shift, { ShiftType, shortenDescriptions } from './Shift'

import SavedStateHandler, { ShiftState } from '../utils/saved-state-handler'
import Course, { CourseColor, CourseWithShiftTypes } from './Course'
import { staticData } from '../utils/api'
import rgbHex from 'rgb-hex'
import { getRandomDarkColor } from '../utils/CourseUpdate'
import hexRgb from 'hex-rgb'

/**
 * Represents a Timetable (that is, the state of the app basically), storing
 * Courses, Shifts and other options.
 * A user can switch between multiple timetables.
 * This class is immutable, therefore every setter returns a new instance.
 */
export default class Timetable implements Comparable {
	private static empty: Timetable;
	private name: string
	private shiftState: ShiftState = { availableShifts: [], selectedShifts: [] }
	private degreeAcronyms: Set<string> = new Set()
	private isMultiShift: boolean
	private academicTerm: string
	// Not stored - derived from shifts on constructor
	private courses: Set<Course> = new Set()
	// { courseId: hexColor }
	private coursesColors: Record<string, string> = {}

	constructor(name: string, shifts: Shift[], isMultishift: boolean, academicTerm: string) {
		this.name = name
		this.shiftState.selectedShifts = shifts
		this.isMultiShift = isMultishift
		this.academicTerm = academicTerm
		shifts.forEach(s => {
			this.courses.add(s.getCourse())
		})

		if (academicTerm === '' || academicTerm === undefined) {
			this.academicTerm = staticData.currentTerm?.id || ''
		}
		this.ensureCoursesHaveColor()
	}

	/**
	 * Returns always the same instance of an empty Timetable.
	 * @returns An instance of an empty Timetable.
	 */
	static emptyTimetable(): Timetable {
		if (Timetable.empty === undefined) {
			Timetable.empty = new Timetable('', [], false, '')
		}
		return Timetable.empty
	}

	static async fromString(str: string): Promise<Timetable | undefined> {
		try {
			const parsedStr = JSON.parse(str)
			const degreesAcronyms: Set<string> = new Set(parsedStr.degrees?.split(SavedStateHandler.PARAMS_SEP))
			const savedState =
				await SavedStateHandler.getInstance().getShifts(parsedStr.shifts, Array.from(degreesAcronyms), parsedStr.academicTerm)
			if (!savedState) return undefined

			const [courses, shiftState] = savedState
			const newTimetable = new Timetable(
				parsedStr.name, shiftState.selectedShifts,
				((parsedStr.isMultishift || 'false') === 'true'), parsedStr.academicTerm
			)
			newTimetable.courses = new Set(courses)
			newTimetable.degreeAcronyms = degreesAcronyms
			newTimetable.shiftState = shiftState
			newTimetable.ensureCoursesHaveColor()
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
		return Timetable.fromString(JSON.stringify(objToParse))
	}

	getDisplayName(): string {
		return this.name
	}

	// =================
	// Courses management

	/**
	 * @returns A list of courses and they shift type statuses.
	 */
	getCoursesWithShiftTypes(): CourseWithShiftTypes[] {
		const res: Record<string, CourseWithShiftTypes> = {}

		this.shiftState.availableShifts.forEach(shift => {
			const courseId = shift.getCourseId()
			const courseWithShiftTypes = res[courseId] || (res[courseId] = {
				course: shift.getCourse(),
				color: this.getCourseColor(shift.getCourse()),
				shiftTypes: {} as Record<ShiftType, boolean>
			})
			courseWithShiftTypes.shiftTypes[shift.getType()] = false
		})

		this.shiftState.selectedShifts.forEach(shift => {
			const courseId = shift.getCourseId()
			const courseWithShiftTypes = res[courseId] || (res[courseId] = {
				course: shift.getCourse(),
				color: this.getCourseColor(shift.getCourse()),
				shiftTypes: {} as Record<ShiftType, boolean>
			})
			courseWithShiftTypes.shiftTypes[shift.getType()] = true
		})

		return Object.values(res)
	}
	
	/**
	 * Ensure the coursesColors list has all the courses this timetable has.
	 */
	private ensureCoursesHaveColor(): void {
		this.courses.forEach(course => {
			if (this.coursesColors[course.getId()]) {
				// Course already has color, ignore
				return
			}
			
			const randomColor = getRandomDarkColor()
			const color = `#${rgbHex(randomColor.red, randomColor.green, randomColor.blue)}`
			this.coursesColors = {...this.coursesColors, [course.getId()]: color}
		})
		Object.freeze(this.coursesColors)
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

		return this.setSelectedShifts(newSelectedShifts)
	}

	/**
	 * Immutably replaces shifts with their updated version,
	 * in order to update occupancies.
	 * @param newShifts The refreshed shifts
	 * @returns A new instance of Timetable with the changes.
	 */
	updateOccupancies(newShifts: Shift[]): Timetable {
		const newTimetable = this.shallowCopy()
		newTimetable.shiftState = {
			availableShifts: newTimetable.getAvailableShifts().map(shift => {
				const newShift = newShifts.find(s => s.equals(shift))
				return newShift || shift
			}),
			selectedShifts: newTimetable.getSelectedShifts().map(shift => {
				const newShift = newShifts.find(s => s.equals(shift))
				return newShift || shift
			})
		}
		return newTimetable
	}

	// =================
	/**
	 * @returns The name of this timetable
	 */
	getName() : string {
		return this.name
	}

	/**
	 * Immutably sets the name for this timetable.
	 * Useful for rename and/or duplication of timetable.
	 * @param name The new name of the Timetable.
	 * @returns A new instance of Timetable with the changes.
	 */
	setName(name: string) : Timetable {
		if (name === this.name) {
			return this
		}
		const newTimetable = this.shallowCopy()
		newTimetable.name = name
		return newTimetable
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
		if (shifts === this.shiftState.availableShifts) {
			return this
		}
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
		if (shifts === this.shiftState.selectedShifts) {
			return this
		}
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
		if (mode === this.isMultiShift) {
			return this
		}
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
		newTimetable.ensureCoursesHaveColor()
		return newTimetable
	}

	/**
	 * @returns an immutable mapping of <courseId, hex color>.
	 */
	getAllCoursesColor(): Record<string, string> {
		return this.coursesColors
	}

	/**
	 * Returns the saved background color and the calculated text color for a course.
	 * @param course The course to get the color for
	 * @returns The background and text color for the course
	 */
	getCourseColor(course: Course): CourseColor {
		const color = this.coursesColors[course.getId()] || '#000'
		return {
			backgroundColor: color,
			textColor: isOkWithWhite(hexRgb(color)) ? '#ffffff' : '#000000'
		}
	}

	/**
	 * Immutably sets the color for a course in this timetable,
	 * returning a new instance of Timetable.
	 * @param course The course to change the color of.
	 * @param color The color to set.
	 * @returns A new instance of Timetable with the changes.
	 */
	setCourseColor(course: Course, color: string): Timetable {
		if (this.coursesColors[course.getId()] === color) {
			return this
		}
		const newTimetable = this.shallowCopy()
		newTimetable.coursesColors = {...newTimetable.coursesColors, [course.getId()]: color}
		Object.freeze(newTimetable.coursesColors)
		return newTimetable
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
			this.isMultiShift,
			this.academicTerm
		)
		newTimetable.shiftState = this.shiftState
		newTimetable.degreeAcronyms = this.degreeAcronyms
		newTimetable.courses = this.courses
		newTimetable.coursesColors = this.coursesColors
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