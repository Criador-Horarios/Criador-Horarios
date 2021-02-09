import Comparable from './Comparable'
import hexRgb from 'hex-rgb'
import rgbHex from 'rgb-hex'
import RandomColor from 'randomcolor'

export default class Course implements Comparable {
	id: string
	acronym: string
	name: string
	semester: number
	abbrev: string
	color: string
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

		const chosenColor = hexRgb(RandomColor({
			luminosity: 'dark',
			alpha: 1
		}))
		this.color = '#' + rgbHex(chosenColor.red, chosenColor.green, chosenColor.blue)
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