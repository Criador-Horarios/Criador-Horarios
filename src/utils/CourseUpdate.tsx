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
			const color = course.removeColor()
			selectedColors.add(color)

			course.isSelected = false

			type = CourseUpdateType.Remove
			this.courses.splice(idx, 1)
		} else {
			// Add color
			const color = Array.from(selectedColors)[Math.floor(Math.random()*selectedColors.size)]
			selectedColors.delete(color)
			course.setColor(color)

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
			const color = c.removeColor()
			selectedColors.add(color)
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
	'#f9a825', '#ef6c00', '#4e342e', '#37474f'
])
