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
	color = ''
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

		// const chosenColor = getRandomDarkColor()
		// this.color = '#' + rgbHex(chosenColor.red, chosenColor.green, chosenColor.blue)
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

const getRandomDarkColor = () => {
	let chosenColor: hexRgb.RgbaObject
	do {
		chosenColor = hexRgb(RandomColor({
			luminosity: 'dark',
			alpha: 1,
			hue: 'random'
		}))
	} while (!isOkWithWhite(chosenColor))
	return chosenColor
}

const isOkWithWhite = function(hexColor: hexRgb.RgbaObject): boolean {
	const C = [ hexColor.red/255, hexColor.green/255, hexColor.blue/255 ]
	for ( let i = 0; i < C.length; ++i ) {
		if ( C[i] <= 0.03928 ) {
			C[i] = C[i] / 12.92
		} else {
			C[i] = Math.pow( ( C[i] + 0.055 ) / 1.055, 2.4)
		}
	}
	const L = 0.2126 * C[0] + 0.7152 * C[1] + 0.0722 * C[2]
	return L <= 0.179
}