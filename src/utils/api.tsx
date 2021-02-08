import { Course, Degree, Shift } from './domain'

export default class API {
	private static ACADEMIC_TERM = '2020/2021';

	// eslint-disable-next-line
	private static async getRequest(url: string): Promise<any> {
		return await fetch('/horarios' + url).then(r => {
			const contentType = r.headers.get('content-type')
			if (contentType?.includes('application/json') && r.status === 200) {
				return r.json()
			} else if (contentType?.includes('text/plain')) {
				return r.text()
			} else {
				return null
			}
		})
	}

	public static async getDegrees(): Promise<Degree[] | null> {
		const res = (await this.getRequest(`/api/degrees?academicTerm=${this.ACADEMIC_TERM}`) as ApiDegree[] | null)
		if (res === null) {
			return null
		}
		const degrees = res.map((d: ApiDegree) => new Degree(d))
		degrees.sort(Degree.compare)
		return degrees
	}

	public static async getCourses(degree: string): Promise<Course[] | null> {
		const res = (await this.getRequest(`/api/degrees/${degree}/courses?academicTerm=${this.ACADEMIC_TERM}`) as ApiCourse[] | null)
		if (res === null) {
			return null
		}
		const courses = res
			.map((d: ApiCourse) => new Course(d))
			.filter( (c: Course) => {
				// FIXME: hardcoded
				return c.semester === 2
			})
		courses.sort(Course.compare)
		return courses
	}

	public static async getCourseSchedules(course: Course): Promise<Shift[] | null> {
		const res = await this.getRequest(`/api/courses/${course.id}/schedule?academicTerm=${this.ACADEMIC_TERM}`) as ApiSchedule | null
		if (res === null) {
			return null
		}
		const shifts = res.shifts.map((d: ApiShift) => new Shift(d, course))
		return shifts
	}

	public static async getShortUrl(): Promise<string> {
		return this.getRequest(`/tinyurl/api-create.php?url=${window.location.href}`)
	}
}

export type ApiDegree = {
	academicTerm: string
	academicTerms: string[]
	acronym: string
	campus: { id: string, name: string, type: string }[]
	id: string
	info: {
		description: string
		designFor: string
		gratuity: string
		history: string
		links: string
		objectives: string
		operationRegime: string
		profissionalExits: string
		requisites: string
	}
	name: string
	teachers: string[]
	type: string
	typeName: string
	url: string
}

export type ApiCourse = {
	academicTerm: string
	acronym: string
	credits: string
	id: string
	name: string
}

export type ApiSchedule = {
	courseLoads: {
		totalQuantity: number
		type: string
		unitQuantity: number
	}[]
	lessonPeriods: {
		start: string
		end: string
	}[]
	shifts: ApiShift[]
}

export type ApiShift = {
	lessons: ApiLesson[]
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

export type ApiLesson = {
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