import Comparable, { Comparables } from './Comparable'
import Lesson, { LessonDto } from './Lesson'
import Course from './Course'
import hexRgb from 'hex-rgb'
import rgbHex from 'rgb-hex'
import { DescriptionSharp } from '@material-ui/icons'
import { stringify } from 'querystring'

const shadeColor = (color: string, amount: number) => {
	const newColor = hexRgb(color)
	Object.keys(newColor).forEach((key: string) => {
		newColor[key as keyof hexRgb.RgbaObject] *= amount
		newColor[key as keyof hexRgb.RgbaObject] = Math.min(Math.max(0, newColor[key as keyof hexRgb.RgbaObject]), 255)
	})
	return '#' + rgbHex(newColor.red, newColor.green, newColor.blue)
}

export enum ShiftType {
	'Teórica' = 'T',
	'Problemas' = 'PB',
	'Laboratorial' = 'L',
	'Seminário' = 'S',
}

export default class Shift implements Comparable {
	courseId: string
	name: string
	type: ShiftType
	acronym: string
	shiftId: string
	courseName: string
	lessons: Lesson[]
	color: string
	campus: string
	
	constructor(obj: ShiftDto, course: Course) {
		this.courseId = course.id
		this.name = obj.name
		const re = /^([A-Za-z\d._]*[A-Za-z])\d+(L|PB|T|S)([\d]{2})$/
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

		const lessons = obj.lessons.map((l: LessonDto) => {
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

	getShortDescription(): string {
		return `${this.courseId}~${this.shiftId}`
	}
}

export const shortenDescriptions = (shifts: Shift[]) => {
	const res = shifts
		.map((s) => s.getShortDescription())
		.reduce((acc, description) => {
			const [course, shift] = description.split('~')
			if (!acc[course]) {
				acc[course] = []
			}
			acc[course] = [...acc[course], shift]
			return acc
		}, {} as Record<string, string[]>)

	return Object.keys(res).map((course) => course + '~' + res[course].join('~')).join(';')
}

export type ShiftDto = {
	lessons: LessonDto[]
	name: string
	occupation: {
		current: number
		max: number
	}
	rooms: {
		capacity: {
			exam: number
			normal: number
		}
		description: string
		id: string
		name: string
		topLevelSpace: {
			id: string
			name: string
			type: string
		}
		type: string
	}[]
	types: string[]
}