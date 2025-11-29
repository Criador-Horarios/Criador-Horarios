import { getColor1, getColor2 } from '../utils/colors'
import Course, { CourseColor } from './Course'
import { ShiftOccupation, ShiftType } from './Shift'

export default interface Lesson {
	// Attention, as this is used by FullCalendar as EventApi, if you use the URL property it will add it to the event
	title: string
	exportedTitle: string
	type: string
	startTime: string
	endTime: string
	date: string
	daysOfWeek: number[]
	id: string
	minutes: number
	occupation: ShiftOccupation
	courseUrl: string
	course: Course
	room: string
	campus: string
}

export interface LessonWithColor extends Lesson {
	color: string
	textColor: string
}

// eslint-disable-next-line
export function createLesson(obj: Record<string, any>): Lesson {
	// TODO this should be typed
	const dateStart = new Date('2021/02/17 ' + obj.start), dateEnd = new Date('2021/02/17 ' + obj.end)
	return {
		daysOfWeek: [obj.dayOfWeek],
		startTime: obj.start,
		endTime: obj.end,
		date: obj.date,
		minutes: (dateEnd.getTime() - dateStart.getTime()) / ( 1000 * 60 ),
		type: obj.type,
		id: obj.shiftName,
		occupation: obj.occupation,
		courseUrl: obj.url,
		course: obj.course,
		room: obj.room,
		title: `${obj.acronym} - ${obj.shiftId}`,
		exportedTitle: `${obj.acronym} - ${obj.shiftId} @ ${obj.room !== undefined ? obj.room : '' }`,
		campus: obj.campus,
	}
}

export function keepUniqueLessons(lessons: Lesson[]): Lesson[] {
	const obj: Record<string, Lesson> = {}
	lessons.forEach(lesson => { obj[lesson.title + lesson.startTime + lesson.endTime + lesson.daysOfWeek[0]] = lesson })
	return Object.values(obj)
}

export function addColorToLesson(lesson: Lesson, color: CourseColor): LessonWithColor {
	let newColor, textColor
	if (lesson.type === ShiftType['Teo']) {
		[newColor, textColor] = getColor1(color.backgroundColor)
	} else if (lesson.type === ShiftType['PB']) {
		[newColor, textColor] = getColor2(color.backgroundColor)
	} else {
		newColor = color.backgroundColor
		textColor = color.textColor
	}

	return {
		...lesson,
		color: newColor,
		textColor,
	}
}

export function changeTimezone(lesson: Lesson, timezone = 'Europe/Lisbon'): Lesson {
	if (!timezone || timezone === 'Europe/Lisbon') {
		return lesson
	}

	const dateInTZ = new Date(new Date(`${lesson.date}T${lesson.startTime}`).toLocaleString('en-US', { timeZone: timezone }))
	const startHours = dateInTZ.getHours().toString().padStart(2, '0')
	const startMinutes = dateInTZ.getMinutes().toString().padStart(2, '0')
	const startTime = `${startHours}:${startMinutes}:00`

	const endDateInTZ = new Date(new Date(`${lesson.date}T${lesson.endTime}`).toLocaleString('en-US', { timeZone: timezone }))
	const endHours = endDateInTZ.getHours().toString().padStart(2, '0')
	const endMinutes = endDateInTZ.getMinutes().toString().padStart(2, '0')
	const endTime = `${endHours}:${endMinutes}:00`

	return {
		...lesson,
		startTime,
		endTime,
	}
}

export type LessonDto = {
	end: string
	start: string
	room: {
		id: string
		name: string
		type: string
		fullName: string
		classification: {
			'pt-PT': string
			'en-GB': string
		}
	}
}
