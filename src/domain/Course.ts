import Comparable from './Comparable'
import { ShiftType } from './Shift'

/**
 * Represents a course of a degree.
 * This class is immutable and cannot be changed.
 */
export default class Course implements Comparable {
	private id = ''
	private acronym = '' // From Fénix
	private name = ''
	private abbrev = '' // Infered from name
	private degreeAcronym = ''
	private url = ''

	static fromDto(obj: CourseDto, degreeAcronym: string): Course {
		const newCourse = new Course()
		newCourse.id = obj.id
		newCourse.acronym = getCourseAcronym(obj.acronym, obj.name)
		newCourse.name = obj.name
		newCourse.abbrev = newCourse.name.split(/[- //]+/).map(d => d[0]).filter(d => {
			if (!d) return false
			return d === d.toUpperCase()
		}).join('')
		newCourse.degreeAcronym = degreeAcronym
		if (obj.url !== undefined) {
			newCourse.url = obj.url
		}

		return newCourse
	}

	getId(): string {
		return this.id
	}

	getAcronym(): string {
		return this.acronym
	}

	getName(): string {
		return this.name
	}

	getAbbrev(): string {
		return this.abbrev
	}

	getDegreeAcronym(): string {
		return this.degreeAcronym
	}

	getUrl(): string {
		return this.url
	}

	equals(other: Course): boolean {
		const nameSem = this.name === other.name
		const diffDegree = (this.degreeAcronym === other.degreeAcronym && this.id === other.id)
		return nameSem && diffDegree
	}

	hashString(): string {
		return this.name + this.degreeAcronym + this.id
	}

	static compare(a: Course, b: Course): number {
		return a.name.localeCompare(b.name) || a.degreeAcronym.localeCompare(b.degreeAcronym)
	}

	searchableName(showDegree: boolean): string {
		return this.abbrev + this.name + this.acronym +
			(showDegree ? this.degreeAcronym : '') // Add degree to be able to only show by degree
	}

	displayName(showDegree: boolean): string {
		let display = this.name
		if (showDegree) {
			if (this.degreeAcronym !== '') {
				display += ` (${this.degreeAcronym})`
			} else {
				display += ' (N/A)'
			}
		}
		return display
	}

}

export type CourseWithShiftTypes = {
	course: Course
	color: CourseColor
	shiftTypes: Record<ShiftType, boolean | undefined>
}

export interface CourseColor {
	backgroundColor: string;
	textColor: string;
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