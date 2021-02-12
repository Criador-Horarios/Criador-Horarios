import Comparable from './Comparable'

export default class Lesson implements Comparable {
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
		this.title = `${obj.acronym} - ${obj.shiftId}\n${obj.campus}`
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