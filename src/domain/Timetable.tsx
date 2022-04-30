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
	// TODO: Add multi shift funcionality
	// Not stored
	courses: Set<Course> = new Set()
	courseUpdates: CourseUpdates = new CourseUpdates()
	errors = ''

	constructor(name: string, shifts: Shift[], isSaved: boolean) {
		this.name = name
		this.shiftState.selectedShifts = shifts
		this.isSaved = isSaved
	}

	static async fromString(str: string): Promise<Timetable | undefined> {
		try {
			const parsedStr = JSON.parse(str)
			const degreesAcronyms: Set<string> = new Set(parsedStr.degrees?.split(SavedStateHandler.PARAMS_SEP))
			const savedState = await SavedStateHandler.getInstance().getShifts(parsedStr.shifts, degreesAcronyms)
			if (!savedState) return undefined

			const [courseUpdate, shiftState, errors] = savedState
			const newTimetable = new Timetable(parsedStr.name, shiftState.selectedShifts, parsedStr.isSaved)
			newTimetable.courses = new Set(courseUpdate.courses)
			newTimetable.degreeAcronyms = degreesAcronyms
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
		const idx = Comparables.indexOf(this.shiftState.selectedShifts, chosenShift)
		// if (idx !== -1 && !multiShiftMode) return
		const shiftCourse = this.courseUpdates.courses.filter(c => c.id === chosenShift.courseId)

		let replacingIndex
		if (multiShiftMode) {
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