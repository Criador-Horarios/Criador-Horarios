import hexRgb from 'hex-rgb'
import rgbHex from 'rgb-hex'
import { isOkWithWhite } from '../utils/colors'
import { getRandomDarkColor } from '../utils/CourseUpdate'
import Comparable from './Comparable'
import Shift from './Shift'

export default class Course implements Comparable {
	id = ''
	acronym = ''
	name = ''
	semester: number
	abbrev = ''
	degreeAcronym = ''
	color = ''
	textColor = ''
	shiftTypes: Map<string, boolean | undefined> = new Map()
	nSelectedShifts = 0
	isSelected = false
	showDegree = false
	url = ''
	randomId = (Math.random() * 10000).toFixed(0)

	private constructor() {
		this.semester = 0
	}

	static fromDto(obj: CourseDto, degreeAcronym: string): Course {
		const newCourse = new Course()
		newCourse.id = obj.id
		newCourse.acronym = getCourseAcronym(obj.acronym, obj.name)
		newCourse.name = obj.name
		newCourse.semester = +obj.academicTerm[0]
		newCourse.abbrev = newCourse.name.split(/[- //]+/).map(d => d[0]).filter(d => {
			if (!d) return false
			return d === d.toUpperCase()
		}).join('')
		newCourse.degreeAcronym = degreeAcronym
		if (obj.url !== undefined) {
			newCourse.url = obj.url
		}

		const color = getRandomDarkColor()
		newCourse.color = '#' + rgbHex(color.red, color.green, color.blue)
		newCourse.textColor = isOkWithWhite(hexRgb(newCourse.color)) ? 'white' : 'black'
		return newCourse
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
		this.textColor = isOkWithWhite(hexRgb(color)) ? 'white' : 'black'
	}

	removeColor(): string {
		const color = this.color
		// this.color = ''
		// this.textColor = 'white'
		return color
	}

	equals(other: Course): boolean {
		const nameSem = (this.name === other.name && this.semester === other.semester)
		const diffDegree = (this.degreeAcronym === other.degreeAcronym && this.id === other.id)
		return nameSem && diffDegree
			
	}

	hashString(): string {
		return this.randomId + this.name + this.semester + this.id
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

	deepCopy(): Course {
		return this
		const newCourse = new Course()
		newCourse.id = this.id
		newCourse.acronym = this.acronym
		newCourse.name = this.name
		newCourse.semester = this.semester
		newCourse.abbrev = this.abbrev
		newCourse.degreeAcronym = this.degreeAcronym
		newCourse.url = this.url
		newCourse.color = this.color
		newCourse.textColor = this.textColor
		newCourse.shiftTypes = new Map(this.shiftTypes)
		return newCourse
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
	let newAcronym = trimTrailingCharacters(acronym)
	const acronymMatch = newAcronym.match(/[^A-Za-z]+(III|II|IV|I|V|VIII|VII|VI|)[^A-Za-z]*$/)
	const nameMatch = name.match(/ (III|II|IV|I|V|VIII|VII|VI|)$/)
	if (nameMatch && !acronymMatch) {
		newAcronym += `-${nameMatch[1]}`
	}
	return newAcronym
}

export const trimTrailingCharacters = (id: string): string => {
	let i: number
	for (i = id.length-1; i >= 0; i--) {
		if (id[i].match(/[a-zA-Z]/)) {
			break
		}
	}
	return id.slice(0, i+1)
}