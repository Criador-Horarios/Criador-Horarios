import hexRgb from 'hex-rgb'
import randomColor from 'randomcolor'
import rgbHex from 'rgb-hex'
import { Comparables } from '../domain/Comparable'
import Course from '../domain/Course'
import { isOkWithWhite } from './colors'

export enum CourseUpdateType {
	Add,
	Remove,
	Clear,
	Many
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

	has(course: Course): boolean {
		return Comparables.includes(this.courses, course)
	}

	toggleCourse(course: Course, skipColor = false): CourseUpdateType {
		const idx = Comparables.indexOf(this.courses, course)

		let type
		if (idx !== -1) {
			// Remove color
			if (!course.hasShiftsSelected() && !skipColor) {
				const color = course.removeColor()
				returnColor(color)
			}

			course.isSelected = false

			type = CourseUpdateType.Remove
			this.courses.splice(idx, 1)
		} else {
			// Add color
			if (!course.hasShiftsSelected() && !skipColor) {
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
	'#6c6f00', '#ef6c00', '#4e342e', '#37474f'
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

export function getCoursesDifference(prevCourses: Course[], courses: Course[]): Update | undefined {
	const prevSet = Comparables.toUnique(prevCourses)
	const newSet = Comparables.toUnique(courses)

	if (prevSet.length === newSet.length) {
		// Nothing changed
		return undefined
	} else if (prevSet.length === newSet.length + 1) {
		// Removed element, find missing in courses
		return { type: CourseUpdateType.Remove, course: prevCourses.find((c: Course) => !Comparables.includes(courses, c)) }
	} else if (prevSet.length === newSet.length - 1) {
		// Added element, return first last on courses
		return { type: CourseUpdateType.Add, course: courses[courses.length - 1] }
	} else if (prevSet.length < newSet.length) {
		return { type: CourseUpdateType.Many, course: undefined }
	}
}