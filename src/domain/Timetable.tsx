import Comparable, { Comparables } from './Comparable'
import Shift, { shortenDescriptions } from './Shift'

import i18next from 'i18next'
import SavedStateHandler, { ShiftState } from '../utils/saved-state-handler'
import Course from './Course'
import CourseUpdates from '../utils/CourseUpdate'

export default class Timetable implements Comparable {
	name: string
	shifts: Shift[]
	degreeAcronyms: Set<string> = new Set()
	isSaved: boolean
	// TODO: Add multi shift funcionality
	// Not stored
	courses: Set<Course> = new Set()
	courseUpdates: CourseUpdates = new CourseUpdates()
	shiftState: ShiftState = { 	availableShifts: [], selectedShifts: [] }
	errors = ''

	constructor(name: string, shifts: Shift[], isSaved: boolean) {
		this.name = name
		this.shifts = shifts
		this.isSaved = isSaved
	}

	static async fromString(str: string): Promise<Timetable | undefined> {
		try {
			const parsedStr = JSON.parse(str)
			const savedState = await SavedStateHandler.getInstance().getShifts(parsedStr.shifts)
			if (!savedState) return undefined

			const [courseUpdate, shiftState, errors] = savedState
			const newTimetable = new Timetable(parsedStr.name, shiftState.selectedShifts, parsedStr.isSaved)
			newTimetable.courses = new Set(courseUpdate.courses)
			newTimetable.degreeAcronyms = new Set(parsedStr.degrees?.split(SavedStateHandler.PARAMS_SEP))
			// Stored for current usage, not kept in storage
			newTimetable.courseUpdates = courseUpdate
			newTimetable.shiftState = shiftState
			newTimetable.errors = errors
			return newTimetable
		} catch (err) {
			// Baaaaah
			console.error(err)
			return undefined
		}
	}

	getDisplayName(): string {
		return this.isSaved ? this.name : `${i18next.t('add')}: “${this.name}”`
	}

	toggleShift(chosenShift: Shift, multiShiftMode = false): void {
		const idx = Comparables.indexOf(this.shifts, chosenShift)
		// if (idx !== -1 && !multiShiftMode) return

		let replacingIndex
		if (multiShiftMode) {
			// We want to allow multiple shifts of the same type, don't replace anything
			replacingIndex = -1
		} else {
			// Verify if of the same type and course to replace, but not the same
			replacingIndex = Comparables.indexOfBy(this.shifts, chosenShift, Shift.isSameCourseAndType)
		}

		// TODO: Change on the course for the selected shift types
		if (idx === -1) {
			if (!this.courseUpdates.has(chosenShift.course)) this.courseUpdates.toggleCourse(chosenShift.course)
			// this.shifts.push(chosenShift)
			this.shiftState.selectedShifts.push(chosenShift)
			if (replacingIndex !== -1) {
				this.shifts.splice(replacingIndex, 1)
			}
			this.courses.add(chosenShift.course)
			this.degreeAcronyms.add(chosenShift.course.degreeAcronym)
		} else {
			// this.shifts.splice(idx, 1)
			this.shiftState.selectedShifts.splice(idx, 1)
			this.courses.delete(chosenShift.course)

			// TODO: When can we remove degrees?
			// this.degreeAcronyms.delete(chosenShift.course.degreeAcronym)
		}
	}

	save(): void {
		this.isSaved = true
	}

	equals(obj: Comparable): boolean {
		return false
	}

	hashString(): string {
		return ''
	}

	getDegreesString(): string[] | undefined {
		const currDegrees = Array.from(this.degreeAcronyms)
		if (currDegrees.length == 0) return undefined
		return currDegrees.reduce((a, b) => `${a};${b}`).split(SavedStateHandler.PARAMS_SEP)
	}

	toString(): string {
		const obj = {
			name: this.name,
			degrees: this.getDegreesString()?.join(SavedStateHandler.PARAMS_SEP),
			shifts: shortenDescriptions(this.shiftState.selectedShifts),
			isSaved: this.isSaved
		}
		return JSON.stringify(obj)
	}
}