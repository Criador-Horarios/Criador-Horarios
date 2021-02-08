import hexRgb from 'hex-rgb'
import rgbHex from 'rgb-hex'
import Comparables from './comparables'
import RandomColor from 'randomcolor'
import { ApiCourse, ApiDegree, ApiLesson, ApiShift } from './api'

export interface Comparable {
	equals(obj: Comparable): boolean
	hashString(): string
}

export class Degree {
	id: string
	acronym: string
	name: string
	isSelected = false

	constructor(obj: ApiDegree) {
		this.id = obj.id
		this.acronym = obj.acronym
		this.name = obj.name
	}

	displayName() : string {
		return this.acronym + ' - ' + this.name
	}

	static compare(a: Degree, b: Degree): number {
		return a.displayName().localeCompare(b.displayName())
	}
}

export class Course implements Comparable {
	id: string
	acronym: string
	name: string
	semester: number
	abbrev: string
	color: string
	isSelected = false

	constructor(obj: ApiCourse) {
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

export enum CourseUpdateType {
	Add,
	Remove,
	Clear
}

export class CourseUpdates {
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

export type Update = {
	type: CourseUpdateType
	course: Course | undefined
}

// TODO: shades in RGB should use multiplication
const shadeColor = (color: string, amount: number) => {
	const newColor = hexRgb(color)
	Object.keys(newColor).forEach((key: string) => {
		newColor[key as keyof hexRgb.RgbaObject] *= amount
		newColor[key as keyof hexRgb.RgbaObject] = Math.min(Math.max(0, newColor[key as keyof hexRgb.RgbaObject]), 255)
	})
	return '#' + rgbHex(newColor.red, newColor.green, newColor.blue)
}

export const campiList = ['Alameda', 'Taguspark']
export enum ShiftType {
	'Teórica' = 'T',
	'Problemas' = 'PB',
	'Laboratorial' = 'L',
	'Seminário' = 'S',
}

export class Shift implements Comparable {
	name: string
	type: ShiftType
	acronym: string
	shiftId: string
	courseName: string
	lessons: Lesson[]
	color: string
	campus: string
	
	constructor(obj: ApiShift, course: Course) {
		this.name = obj.name
		const re = /^([A-Za-z\d]*[A-Za-z])\d+(L|PB|T|S)([\d]{2})$/
		const match = this.name.match(re)
		if (match === null) {
			throw 'Unexpected shift name'
		}
		this.acronym = match[1]
		this.type = match[2] as ShiftType
		this.shiftId = match[2] + match[3]
		this.courseName = course.name
		this.campus = obj.rooms[0]?.topLevelSpace.name

		if (this.type === ShiftType['Teórica']) {
			this.color = shadeColor(course.color, 1.30)
		} else if (this.type === ShiftType['Problemas']) {
			this.color = shadeColor(course.color, 1.15)
		} else {
			this.color = course.color
		}

		const lessons = obj.lessons.map((l: ApiLesson) => {
			return new Lesson({
				shiftName: this.name,
				color: this.color,
				start: l.start.split(' ')[1],
				end: l.end.split(' ')[1],
				dayOfWeek:  new Date(l.start).getDay(),
				room: l.room.name,
				campus: l.room.topLevelSpace.name,
				acronym: this.acronym,
				shiftId: this.shiftId,
				id: this.name
			})
		})
		this.lessons = Comparables.toUnique(lessons) as Lesson[]
	}

	static isSameCourseAndType(o1: Comparable, o2: Comparable): boolean {
		// FIXME: Verify if is a shift
		const s1 = o1 as Shift
		const s2 = o2 as Shift
		return s1.courseName === s2.courseName && s1.type === s2.type && s1.name !== s2.name
	}

	equals(other: Shift): boolean {
		return this.name === other.name
	}

	hashString(): string {
		return this.name
	}
}

export class Lesson implements Comparable {
	title: string
	type: string
	startTime: string
	endTime: string
	daysOfWeek: number[]
	color: string
	id: string

	// eslint-disable-next-line
	constructor(obj: Record<string, any>) {
		this.daysOfWeek = [obj.dayOfWeek]
		this.startTime = obj.start
		this.endTime = obj.end
		this.color = obj.color
		this.type = obj.type
		this.id = obj.shiftName

		this.title = `${obj.acronym} - ${obj.shiftId}\n${obj.room} @ ${obj.campus}`
	}

	hashString(): string {
		return this.title + this.startTime + this.endTime + this.daysOfWeek[0]
	}

	equals(other: Lesson): boolean {
		return this.hashString() === other.hashString()
	}
}