import Shift, { ShiftDto } from '../domain/Shift'
import Degree, { DegreeDto } from '../domain/Degree'
import Course, { CourseDto } from '../domain/Course'
import { ScheduleDto } from '../domain/Schedule'
import AcademicTerm from '../domain/AcademicTerm'

export default class API {
	static ACADEMIC_TERM = '2020/2021'
	static SEMESTER = 2
	static LANG = 'pt-PT'
	static PREFIX = ''
	static PATH_PREFIX = ''

	// eslint-disable-next-line
	private static async getRequest(url: string): Promise<any> {
		return fetch(`${API.PATH_PREFIX}${url}?academicTerm=${this.ACADEMIC_TERM}&lang=${this.LANG}`).then(r => {
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

	public static setPrefix(): void {
		const cut = window.location.pathname.slice(-1) === '/' ? 1 : 0
		API.PATH_PREFIX = window.location.pathname.slice(0, window.location.pathname.length - cut)
		API.PREFIX = `${window.location.protocol}//${window.location.host}${window.location.pathname}`	
	}

	public static getUrlParams(): Record<string, string> {
		const params = window.location.href.slice(API.PREFIX.length)
		if (params.startsWith('?')) {
			const re = /(&|\?)([A-Za-z]\w*)=(.*)(&|$)/g
			const matches = params.matchAll(re)
			return Array.from(matches).reduce((acc: Record<string, string>, match) => {
				acc[match[2]] = match[3]
				return acc
			}, {})
		}
		return {}
	}

	public static async getDegrees(): Promise<Degree[] | null> {
		const res = (await this.getRequest('/api/degrees') as DegreeDto[] | null)
		if (res === null) {
			return null
		}
		const degrees = res.map((d: DegreeDto) => new Degree(d))
		return degrees.sort(Degree.compare)
	}

	public static async getCourses(degree: string): Promise<Course[] | null> {
		const res = (await this.getRequest(`/api/degrees/${degree}/courses`) as CourseDto[] | null)
		if (res === null) {
			return null
		}
		const courses = res
			.map((d: CourseDto) => new Course(d))
			.filter( (c: Course) => {
				return c.semester === this.SEMESTER
			})
		return courses.sort(Course.compare)
	}

	public static async getCourse(course: string): Promise<Course | null> {
		const res = (await this.getRequest(`/api/courses/${course}`) as CourseDto | null)
		if (res === null) {
			return null
		}
		res.id = course
		return new Course(res)
	}

	public static async getCourseSchedules(course: Course): Promise<Shift[] | null> {
		const res = await this.getRequest(`/api/courses/${course.id}/schedule`) as ScheduleDto | null
		if (res === null) {
			return null
		}
		// course might be unselected because of async
		if (!course.isSelected) {
			return []
		}
		let hasBeenUnselected = false
		const shifts = res.shifts.map((d: ShiftDto) => {
			if (!course.isSelected) {
				hasBeenUnselected = true
				return null
			}
			const shift = new Shift(d, course)
			course.addShift(shift)
			return shift
		})
		if (hasBeenUnselected) {
			return []
		}
		course.saveShifts()
		return shifts as Shift[]
	}

	public static async getAcademicTerms(): Promise<AcademicTerm[]> {
		const res = (await this.getRequest('/api/academicterms')) as [] | null
		if (res === null) {
			return []
		}
		// Prepare from array of [string, [string, string]] to array of string
		return Object.entries(res)
			.sort()
			.reverse()
			.slice(0, 2)
			.map((arr) => arr[1])
			.flat()
			.map((s) => new AcademicTerm(s as string))
	}

	public static async getShortUrl(state: string): Promise<string> {
		return `${API.PREFIX}?s=${state}`
	}
}

export const staticData = {
	terms: [] as AcademicTerm[]
}