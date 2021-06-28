import Comparable from './Comparable'
import Shift, { ShiftType } from './Shift'

export default class Course implements Comparable {
	id: string
	acronym: string
	name: string
	semester: number
	abbrev: string
	degreeAcronym: string
	color = ''
	shiftTypes: Map<string, boolean | undefined> = new Map()
	nSelectedShifts = 0
	isSelected = false
	showDegree = false
	url = ''

	constructor(obj: CourseDto, degreeAcronym: string) {
		this.id = obj.id
		this.acronym = getCourseAcronym(obj.acronym, obj.name)
		this.name = obj.name
		this.semester = +obj.academicTerm[0]
		this.abbrev = this.name.split(/[- //]+/).map(d => d[0]).filter(d => {
			if (!d) return false
			return d === d.toUpperCase()
		}).join('')
		this.degreeAcronym = degreeAcronym
		if (obj.url !== undefined) {
			this.url = obj.url
		}

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
		this.nSelectedShifts++
	}

	removeSelectedShift(shift: Shift): void {
		this.shiftTypes.set(shift.type, false)
		this.nSelectedShifts--
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
		return this.nSelectedShifts > 0
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
		const nameSem = (this.name === other.name && this.semester === other.semester)
		const diffDegree = (this.degreeAcronym === other.degreeAcronym && this.id === other.id)
		return nameSem && diffDegree
			
	}

	hashString(): string {
		return this.name + this.semester + this.id
	}

	static compare(a: Course, b: Course): number {
		const nameSem = (a.name === b.name && a.semester === b.semester)
		const diffDegree = (a.degreeAcronym === b.degreeAcronym && a.id === b.id)
		if (nameSem && !diffDegree) {
			a.showDegree = true
			b.showDegree = true
		}
		const sem = a.semester < b.semester ? -1 : a.semester === b.semester ? 0 : 1
		return sem || a.name.localeCompare(b.name)
	}

	searchableName(): string {
		return this.abbrev + this.name + this.acronym +
			(this.showDegree ? this.degreeAcronym : '') // Add degree to be able to only show by degree
	}

	displayName(): string {
		let display = this.name
		if (this.showDegree) {
			if (this.degreeAcronym !== '') {
				display += ` (${this.degreeAcronym})`
			} else {
				display += ' (N/A)'
			}
		}
		return display
	}

	updateDegree(degreesAcronyms: string[]): void {
		if (this.degreeAcronym.length === 0 || degreesAcronyms.length === 0) {
			// How did this happen???
		} else {
			if (degreesAcronyms.length > 1) {
				this.showDegree = true
			}
			// Filter out unselected degrees when coming from previous sessions
			const possibleDegrees = this.degreeAcronym.split('/').filter((a) => degreesAcronyms.includes(a))
			if (possibleDegrees.length > 0) { // Only change if has a possible degree
				this.degreeAcronym = possibleDegrees.join('/')
			}
		}
	}
}

export type CourseDto = {
	academicTerm: string
	acronym: string
	credits: string
	id: string
	name: string
	url: string
	competences: {
		degrees: {
			id: string,
			name: string,
			acronym: string
		}[]
	}[]
}

function getCourseAcronym(acronym: string, name: string): string {
	let newAcronym = trimTrailingNumbers(acronym)
	const match = name.match(/ (III|II|I|IV|V|VIII|VII|VI|)$/)
	if (match) {
		newAcronym += `-${match[1]}`
	}
	return newAcronym
}

export const trimTrailingNumbers = (id: string): string => {
	let i: number
	for (i = id.length-1; i >= 0; i--) {
		if (!(id[i] >= '0' && id[i] <= '9')) {
			break
		}
	}
	return id.slice(0, i+1)
}