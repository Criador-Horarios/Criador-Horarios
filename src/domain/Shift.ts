import Comparable from './Comparable'
import Lesson, { createLesson, keepUniqueLessons, LessonDto } from './Lesson'
import Course from './Course'
import { getColor1, getColor2 } from '../utils/colors'
import Class, { ClassDto } from './Class'

export enum ShiftType {
	'Teo' = 'T',
	'TP' = 'TP',
	'PB' = 'PB',
	'Prat' = 'P',
	'Lab' = 'L',
	'Sem' = 'S',
}

export const ShiftTypeFenix: Record<string, string> = {
	'T': 'THEORETICAL',
	'TP': 'THEORETICAL_PRACTICAL',
	'PB': 'PROBLEMS',
	'P': 'PRACTICAL',
	'L': 'LABORATORY',
	'S': 'SEMINARY',
}

/**
 * Represents a shift of a course, which can have multiple lessons.
 * This class is immutable and cannot be changed.
 */
export default class Shift implements Comparable {
	private course: Course
	private name: string
	private type: ShiftType
	private shiftId: string
	private lessons: Lesson[]
	private allLessons: Lesson[]
	private campus = ''
	private occupation: ShiftOccupation
	private classes: Class[]
	
	constructor(obj: ShiftDto, course: Course) {
		this.course = course
		this.name = obj.name

		const fenixType = obj.types[0]

		const type = Object.keys(ShiftTypeFenix).find(key => ShiftTypeFenix[key] === fenixType)
		this.type = (type as string) as ShiftType

		const re = /^(.+)([\d]{2})$/
		const match = this.name.match(re)
		if (match === null) {
			this.shiftId = this.name
			console.error(`Unexpected shift name - ${this.name}`)
		} else {
			this.shiftId = this.type + match[2]
		}

		this.campus = obj.classes[0].degree.campi[0].name

		this.occupation = {
			current: obj.enrolments.current,
			max: obj.enrolments.maximum,
		}

		const lessons = obj.lessons.map((l: LessonDto) => {
			const startDate = new Date(l.start)
			return createLesson({
				shiftName: this.name,
				start: l.start.split('T')[1],
				end: l.end.split('T')[1],
				date: startDate,
				dayOfWeek: startDate.getDay(),
				room: l.room?.name,
				campus: this.campus,
				acronym: this.getAcronym(),
				shiftId: this.shiftId,
				id: this.name,
				occupation: this.occupation,
				type: this.type,
				url: this.getCourse().getUrl(),
				course: course,
			})
		})

		this.allLessons = lessons
		this.lessons = keepUniqueLessons(lessons)
		this.classes = obj.classes.map((c) => new Class(c))
	}

	static isSameCourseAndType(o1: Comparable, o2: Comparable): boolean {
		// FIXME: Verify if is a shift
		const s1 = o1 as Shift
		const s2 = o2 as Shift
		return s1.getCourseName() === s2.getCourseName() && s1.type === s2.type && s1.name !== s2.name
		// If we need to replace shifts from same courses from different degrees (like CDI from LEIC-A and MEEC)
		// comment the next line
			&& s1.getCourseId() === s2.getCourseId()
	}

	equals(other: Shift): boolean {
		return this.name === other.name && this.getCourseId() === other.getCourseId()
	}

	hashString(): string {
		return this.name
	}

	getStoredId(): string {
		return this.name
	}

	getFullId(): string[] {
		return [this.getCourseId(), this.getStoredId()]
	}

	getCourse(): Course {
		return this.course
	}

	getCourseId(): string {
		return this.getCourse().getId()
	}

	getCourseName(): string {
		return this.getCourse().getName()
	}

	getAcronym(): string {
		return this.getCourse().getAcronym()
	}

	getAcronymWithId(): string {
		return this.getAcronym() + ' - ' + this.getShiftId()
	}

	getName(): string {
		return this.name
	}

	getType(): ShiftType {
		return this.type
	}

	getShiftId(): string {
		return this.shiftId
	}

	getLessons(): Lesson[] {
		return this.lessons
	}

	getAllLessons(): Lesson[] {
		return this.allLessons
	}

	getCampus(): string {
		return this.campus
	}

	getOccupation(): ShiftOccupation {
		return this.occupation
	}

	getClasses(): Class[] {
		return this.classes
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
	let res = shifts.map((s) => s.getCourse().getDegreeAcronym())
	res = Array.from(new Set(res)) // Remove duplicates
	if (res.length == 0) return undefined
	return res.reduce((a, b) => `${a};${b}`)
}

export type ShiftDto = {
	lessons: LessonDto[]
	name: string
	enrolments: {
		current: number
		maximum: number
	}
	types: string[]
	classes: ClassDto[]
	rooms: unknown[]
}

export type ShiftOccupation = {
	current: number
	max: number
}
