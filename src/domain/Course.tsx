import Comparable from './Comparable'
import Shift, { ShiftType } from './Shift'

export default class Course implements Comparable {
	id: string
	acronym: string
	name: string
	semester: number
	abbrev: string
	color = ''
	shiftTypes: Map<string, boolean | undefined> = new Map()
	selectedShifts = 0
	isSelected = false

	constructor(obj: CourseDto) {
		this.id = obj.id
		this.acronym = obj.acronym.replace(/\d/g, '')
		this.name = obj.name
		this.semester = +obj.academicTerm[0]
		this.abbrev = this.name.split(/[- //]+/).map(d => d[0]).filter(d => {
			if (!d) return false
			return d === d.toUpperCase()
		}).join('')

		Object.values(ShiftType).forEach( (s) => {
			this.shiftTypes.set(s, undefined)
		})

		// const chosenColor = getRandomDarkColor()
		// this.color = '#' + rgbHex(chosenColor.red, chosenColor.green, chosenColor.blue)
	}

	addShift(shift: Shift): void {
		this.shiftTypes.set(shift.type, false)
	}

	addSelectedShift(shift: Shift): void {
		this.shiftTypes.set(shift.type, true)
		this.selectedShifts++
	}

	removeSelectedShift(shift: Shift): void {
		this.shiftTypes.set(shift.type, false)
		this.selectedShifts--
	}

	saveShifts(): void {
		const undefinedKeys = Array.from(this.shiftTypes).filter( (s) => s[1] === undefined)
		undefinedKeys.forEach( (arr) => this.shiftTypes.delete(arr[0]))
	}

	clearSelectedShifts(): void {
		this.shiftTypes.forEach( (value, key) => {
			if (value !== undefined) this.shiftTypes.set(key as string, false)
		})
	}

	hasShiftsSelected(): boolean {
		return this.selectedShifts > 0
	}

	getShiftsDisplay(): Map<string, boolean | undefined> {
		return this.shiftTypes
	}

	setColor(color: string): void {
		this.color = color
	}

	removeColor(): string {
		const color = this.color
		this.color = ''
		return color
	}

	equals(other: Course): boolean {
		return this.name === other.name && this.semester === other.semester
	}

	hashString(): string {
		return this.name + this.semester
	}

	static compare(a: Course, b: Course): number {
		const sem = a.semester < b.semester ? -1 : a.semester === b.semester ? 0 : 1
		return sem || a.name.localeCompare(b.name)
	}

	searchableName(): string {
		return this.abbrev + this.name + this.acronym
	}

	displayName() : string {
		return this.name
	}
}

export type CourseDto = {
	academicTerm: string
	acronym: string
	credits: string
	id: string
	name: string
}