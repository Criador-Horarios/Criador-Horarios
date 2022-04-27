import Comparable, { Comparables } from './Comparable'
import Shift, { shortenDescriptions } from './Shift'

import i18next from 'i18next'
import Degree from './Degree'
import SavedStateHandler from '../utils/saved-state-handler'

export default class Timetable implements Comparable {
	name: string
	shifts: Shift[]
	degrees: Degree[] = []
	isSaved: boolean

	constructor(name: string, shifts: Shift[], isSaved: boolean) {
		this.name = name
		this.shifts = shifts
		this.isSaved = isSaved
	}

	static async fromString(str: string): Promise<Timetable | undefined> {
		try {
			const parsedStr = JSON.parse(str)
			// TODO: Build shifts
			const savedState = await SavedStateHandler.getInstance().getShifts(parsedStr.shifts)
			if (!savedState) return undefined
			const [_, shiftState, _1] = savedState
			return new Timetable(parsedStr.name, shiftState.selectedShifts, parsedStr.isSaved)
		} catch (err) {
			// Baaaaah
			return undefined
		}
	}

	getDisplayName(): string {
		return this.isSaved ? this.name : `${i18next.t('add')}: “${this.name}”`
	}

	addShift(chosenShift: Shift, multiShiftMode = false): void {
		const idx = Comparables.indexOf(this.shifts, chosenShift)
		if (idx !== -1 && !multiShiftMode) return

		let replacingIndex
		if (multiShiftMode) {
			// We want to allow multiple shifts of the same type, don't replace anything
			replacingIndex = -1
		} else {
			// Verify if of the same type and course to replace, but not the same
			replacingIndex = Comparables.indexOfBy(this.shifts, chosenShift, Shift.isSameCourseAndType)
		}

		// FIXME: Check if we need to add to the courses
		if (idx === -1) {
			this.shifts.push(chosenShift)
			if (replacingIndex !== -1) {
				this.shifts.splice(replacingIndex, 1)
			}
		} else {
			this.shifts.splice(idx, 1)
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

	toString(): string {
		const obj = {
			name: this.name,
			shifts: shortenDescriptions(this.shifts),
			isSaved: this.isSaved
		}
		return JSON.stringify(obj)
	}
}