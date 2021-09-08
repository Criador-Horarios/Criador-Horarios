import Comparable, { Comparables } from './Comparable'
import Lesson, { LessonDto } from './Lesson'
import Course from './Course'
import { getColor1, getColor2 } from '../utils/colors'

export enum ShiftType {
	'Teo' = 'T',
	'PB' = 'PB',
	'Lab' = 'L',
	'TP' = 'TP',
	'Sem' = 'S',
}

export default class Shift implements Comparable {
	courseId: string
	course: Course
	name: string
	type: ShiftType
	acronym: string
	shiftId: string
	courseName: string
	lessons: Lesson[]
	allLessons: Lesson[]
	color = ''
	campus = ''
	occupation: ShiftOccupation
	url: string
	
	constructor(obj: ShiftDto, course: Course) {
		this.courseId = course.id
		this.course = course
		this.name = obj.name
		const re = /^(.+)(L|PB|T|S|TP)([\d]{2})$/
		const match = this.name.match(re)
		if (match === null) {
			throw `Unexpected shift name - ${this.name}`
		}
		// Use course acronym
		this.acronym = course.acronym
		this.type = match[2] as ShiftType
		this.shiftId = match[2] + match[3]
		this.courseName = course.name
		if (obj.rooms !== null || (obj.rooms as string[]).length > 0) {
			this.campus = obj.rooms[0]?.topLevelSpace.name
		}

		this.updateColorFromCourse()

		this.occupation = {
			current: obj.occupation.current,
			max: obj.occupation.max,
		}
		this.url = course.url

		const lessons = obj.lessons.map((l: LessonDto) => {
			return new Lesson({
				shiftName: this.name,
				color: this.color,
				start: l.start.split(' ')[1],
				end: l.end.split(' ')[1],
				date: l.start.split(' ')[0],
				// Replacing space to T to allow parsing on SAFARI
				dayOfWeek:  new Date(l.start.replace(' ', 'T')).getDay(),
				room: l.room?.name,
				campus: l.room?.topLevelSpace.name,
				acronym: this.acronym,
				shiftId: this.shiftId,
				id: this.name,
				occupation: this.occupation,
				type: this.type,
				url: this.url,
				courseName: course.name
			})
		})

		this.allLessons = lessons
		this.lessons = Comparables.toUnique(lessons) as Lesson[]
	}

	static isSameCourseAndType(o1: Comparable, o2: Comparable): boolean {
		// FIXME: Verify if is a shift
		const s1 = o1 as Shift
		const s2 = o2 as Shift
		return s1.courseName === s2.courseName && s1.type === s2.type && s1.name !== s2.name
		// If we need to replace shifts from same courses from different degrees (like CDI from LEIC-A and MEEC)
		// comment the next line
			&& s1.courseId === s2.courseId
	}

	equals(other: Shift): boolean {
		return this.name === other.name && this.courseId === other.courseId
	}

	hashString(): string {
		return this.name
	}

	getStoredId(): string {
		return this.name
	}

	getFullId(): string[] {
		return [this.courseId, this.getStoredId()]
	}

	updateColorFromCourse(): void {
		let newColor = this.color
		if (this.type === ShiftType['Teo']) {
			newColor = getColor1(this.course.color)
		} else if (this.type === ShiftType['PB']) {
			newColor = getColor2(this.course.color)
		} else {
			newColor = this.course.color
		}

		// If has lessons, update their color
		if (this.color != newColor) {
			this.lessons?.forEach(lesson => lesson.color = newColor)
		}

		this.color = newColor
	}
}

export const shortenDescriptions = (shifts: Shift[]): string => {
	// TODO: This can now be a dictionary or something
	const res = shifts
		.map((s) => s.getFullId())
		.reduce((acc, [course, shift]) => {
			if (!acc[course]) {
				acc[course] = []
			}
			acc[course] = [...acc[course], shift]
			return acc
		}, {} as Record<string, string[]>)

	return Object.keys(res).map((course) => course + '~' + res[course].join('~')).join(';')
}

export const getDegreesAcronyms = (shifts: Shift[]): string | undefined => {
	let res = shifts
		.map((s) => s.course.degreeAcronym)
	res = Array.from(new Set(res)) // Remove duplicates
	if (res.length == 0) return undefined
	return res.reduce((a, b) => `${a};${b}`)
}

export type ShiftDto = {
	lessons: LessonDto[]
	name: string
	occupation: ShiftOccupation
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

export type ShiftOccupation = {
	current: number
	max: number
}
