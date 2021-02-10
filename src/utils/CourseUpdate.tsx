import hexRgb from 'hex-rgb'
import randomColor from 'randomcolor'
import rgbHex from 'rgb-hex'
import { Comparables } from '../domain/Comparable'
import Course from '../domain/Course'

export enum CourseUpdateType {
	Add,
	Remove,
	Clear
}

export type Update = {
	type: CourseUpdateType
	course: Course | undefined
}

export default class CourseUpdates {
	courses: Course[]
	lastUpdate?: Update

	constructor() {
		this.courses = []
	}

	toggleCourse(course: Course): CourseUpdateType {
		const idx = Comparables.indexOf(this.courses, course)

		let type
		if (idx !== -1) {
			// Remove color
			if (!course.hasShiftsSelected()) {
				const color = course.removeColor()
				returnColor(color)
			}

			course.isSelected = false

			type = CourseUpdateType.Remove
			this.courses.splice(idx, 1)
		} else {
			// Add color
			if (!course.hasShiftsSelected()) {
				const color = getColor()
				course.setColor(color)
			}

			course.isSelected = true

			type = CourseUpdateType.Add
			this.courses.push(course)
		}

		this.lastUpdate = {
			type,
			course
		} as Update
		return type
	}

	removeAllCourses(): void {
		this.courses.forEach( (c: Course) => {
			c.isSelected = false
			if (!c.hasShiftsSelected) {
				returnColor(c.removeColor())
			}
		})

		this.courses = []
		this.lastUpdate = {
			type: CourseUpdateType.Clear,
			course: undefined
		} as Update
	}
}

const selectedColors = new Set([
	'#c62828', '#6a1b9a', '#283593',
	'#0277bd', '#00695c', '#558b2f',
	'#524c00', '#ef6c00', '#4e342e', '#37474f'
])
const initialColors = new Set(selectedColors)

export function getColor(): string {
	let chosenColor: string
	if (initialColors.size > 0) {
		chosenColor = Array.from(initialColors)[Math.floor(Math.random()*initialColors.size)]
		initialColors.delete(chosenColor)
	} else {
		const color = getRandomDarkColor()
		chosenColor = '#' + rgbHex(color.red, color.green, color.blue)
	}
	return chosenColor
}

export function returnColor(color: string): void {
	if (initialColors.has(color)) {
		selectedColors.add(color)
	}
}

const getRandomDarkColor = () => {
	let chosenColor: hexRgb.RgbaObject
	do {
		chosenColor = hexRgb(randomColor({
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
