import Comparable, { Comparables } from './Comparable'
import Lesson, { createLesson, keepUniqueLessons, LessonDto } from './Lesson'
import Course from './Course'
import { getColor1, getColor2 } from '../utils/colors'

export enum ShiftType {
	'Teo' = 'T',
	'TP' = 'TP',
	'PB' = 'PB',
	'Prat' = 'P',
	'Lab' = 'L',
	'Sem' = 'S',
}

export enum ShiftTypeFenix {
	'Teo' = 'TEORICA',
	'TP' = 'TEORICO_PRATICA',
	'PB' = 'PROBLEMS',
	'Prat' = 'PRATICA',
	'Lab' = 'LABORATORIAL',
	'Sem' = 'SEMINARY',
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
	campus = ''
	occupation: ShiftOccupation
	url: string
	
	constructor(obj: ShiftDto, course: Course) {
		this.courseId = course.getId()
		this.course = course
		this.name = obj.name

		const fenixType = obj.types[0] as ShiftTypeFenix
		// TODO: Improve, we should be able to get immediately
		const type = Object.entries(ShiftTypeFenix).find(x => x[1] === fenixType)
		const re = /^(.+)([\d]{2})$/
		const match = this.name.match(re)
		if (match === null || type === undefined) {
			throw `Unexpected shift name - ${this.name}`
		}
		
		this.type = Object.entries(ShiftType).filter(x => x[0] === type[0])[0][1]
		this.shiftId = this.type + match[2]

		// Use course acronym
		this.acronym = course.getAcronym()
		this.courseName = course.getName()
		if (obj.rooms !== null || (obj.rooms as string[]).length > 0) {
			this.campus = obj.rooms[0]?.topLevelSpace.name
		}

		this.occupation = {
			current: obj.occupation.current,
			max: obj.occupation.max,
		}
		this.url = course.getUrl()

		const lessons = obj.lessons.map((l: LessonDto) => {
			return createLesson({
				shiftName: this.name,
				start: l.start.split(' ')[1],
				end: l.end.split(' ')[1],
				date: l.start.split(' ')[0],
				// Replacing space to T to allow parsing on SAFARI
				dayOfWeek: new Date(l.start.replace(' ', 'T')).getDay(),
				room: l.room?.name,
				campus: l.room?.topLevelSpace.name || this.campus,
				acronym: this.acronym,
				shiftId: this.shiftId,
				id: this.name,
				occupation: this.occupation,
				type: this.type,
				url: this.url,
				course: course,
			})
		})

		this.allLessons = lessons
		this.lessons = keepUniqueLessons(lessons)
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

	/**
	 * Get the color of the shift based on this shift's course
	 * @param courseColor The color of this shift's course
	 */
	getColor(courseColor: string): string {
		let newColor
		if (this.type === ShiftType['Teo']) {
			[newColor, ] = getColor1(courseColor)
		} else if (this.type === ShiftType['PB']) {
			[newColor, ] = getColor2(courseColor)
		} else {
			newColor = courseColor
		}
		
		return newColor
	}

	updateOccupancy(newOccupancy: ShiftOccupation): void {
		this.occupation = {
			current: newOccupancy.current,
			max: newOccupancy.max,
		}
	}

	toString(): string {
		return this.getFullId().join(';')
	}
}

export const shortenDescriptions = (shifts: Shift[]): string => {
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
		.map((s) => s.course.getDegreeAcronym())
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
