import Comparable from './Comparable'
import { ShiftOccupation } from './Shift'

export default class Lesson implements Comparable {
	// Attention, as this is used by FullCalendar as EventApi, if you use the URL property it will add it to the event
	title: string
	exportedTitle: string
	type: string
	startTime: string
	endTime: string
	date: string
	daysOfWeek: number[]
	color: string
	id: string
	minutes: number
	occupation: ShiftOccupation
	courseUrl: string
	courseName: string
	room: string

	// eslint-disable-next-line
	constructor(obj: Record<string, any>) {
		this.daysOfWeek = [obj.dayOfWeek]
		this.startTime = obj.start
		this.endTime = obj.end
		this.date = obj.date
		const dateStart = new Date('2021/02/17 ' + obj.start), dateEnd = new Date('2021/02/17 ' + obj.end)
		this.minutes = (dateEnd.getTime() - dateStart.getTime()) / ( 1000 * 60 )
		this.color = obj.color
		this.type = obj.type
		this.id = obj.shiftName
		this.occupation = obj.occupation
		this.courseUrl = obj.url
		this.courseName = obj.courseName
		this.room = obj.room
		this.title = `${obj.acronym} - ${obj.shiftId}\n${ (obj.campus !== undefined) ? obj.campus : '' }`
		this.exportedTitle = `${obj.acronym} - ${obj.shiftId} @ ${obj.room !== undefined ? obj.room : '' }`
	}

	hashString(): string {
		return this.title + this.startTime + this.endTime + this.daysOfWeek[0]
	}

	equals(other: Lesson): boolean {
		return this.hashString() === other.hashString()
	}
}

export type LessonDto = {
	end: string
	start: string
	room: {
		id: string
		name: string
		topLevelSpace: {
			id: string
			name: string
			type: string
		}
		type: string
	}
}