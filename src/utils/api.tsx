import AcademicTerm from '../domain/AcademicTerm'
import Course, { CourseDto } from '../domain/Course'
import Degree, { DegreeDto } from '../domain/Degree'
import { ScheduleDto } from '../domain/Schedule'
import Shift, { ShiftDto } from '../domain/Shift'

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

	public static setLanguage(recvLang: string): void {
		const lang = languages.has(recvLang)
		if (lang) {
			API.LANG = languages.get(recvLang) as string
		} else {
			API.LANG = languages.get('en') as string
		}
	}

	public static getUrlParams(): Record<string, string> {
		const params = window.location.href.slice(API.PREFIX.length)
		if (params.startsWith('?')) {
			const re = /(\?|&)([^=]+)=([^&]+)/g
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

	public static async getCourses(degree: Degree): Promise<Course[] | null> {
		const res = (await this.getRequest(`/api/degrees/${degree.id}/courses`) as CourseDto[] | null)
		if (res === null) {
			return null
		}
		const courses = res
			.map((d: CourseDto) => new Course(d, degree.acronym))
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
		let courseAcronyms = ''
		if (res.competences !== undefined && res.competences.length > 0 && res.competences[0] !== undefined
			&& res.competences[0].degrees !== undefined && res.competences[0].degrees.length > 0
		) {
			courseAcronyms = res.competences[0].degrees.map(d => d.acronym).join('/')
		}
		return new Course(res, courseAcronyms)
	}

	public static async getCourseSchedules(course: Course): Promise<Shift[] | null> {
		const res = await this.getRequest(`/api/courses/${course.id}/schedule`) as ScheduleDto | null
		if (res === null) {
			console.error('can\'t get course schedule')
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

	public static async getShortUrl(params: string[]): Promise<string> {
		return `${API.PREFIX}?${params.join('&')}`
	}

	public static async getPage(url: string): Promise<string | null> {
		return fetch(`${API.PATH_PREFIX}${url}`).then(r => {
			const contentType = r.headers.get('content-type')
			if (contentType?.includes('text/html') && r.status === 200) {
				return r.text()
			} else {
				return null
			}
		})
	}
}

export const staticData = {
	terms: [] as AcademicTerm[]
}

export async function defineCurrentTerm(): Promise<void> {
	const today = new Date()
	const currentYear = today.getFullYear(), currentMonth = today.getMonth() + 1 // Month starts at 0

	let currentTerm = '', semester = 0
	// First semester (After August)
	if (currentMonth >= 8 ) {
		currentTerm = `${currentYear}/${currentYear+1}`
		semester = 1
	} 
	// Second semester
	else {
		currentTerm = `${currentYear-1}/${currentYear}`
		semester = 2
	}

	API.ACADEMIC_TERM = currentTerm
	API.SEMESTER = semester

	API.getAcademicTerms().then(r => staticData.terms = r)
}

const languages = new Map([
	['en', 'en-GB'],
	['pt', 'pt-PT']
])

