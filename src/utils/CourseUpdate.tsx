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
			type = CourseUpdateType.Remove
			this.courses.splice(idx, 1)
		} else {
			type = CourseUpdateType.Add
			this.courses.push(course)
		}

		this.lastUpdate = {
			type,
			course
		} as Update
		return type
	}
}
