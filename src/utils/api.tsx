import AcademicTerm from '../domain/AcademicTerm'
import Course, { CourseDto } from '../domain/Course'
import Degree, { DegreeDto } from '../domain/Degree'
import { ScheduleDto } from '../domain/Schedule'
import Shift, { ShiftDto } from '../domain/Shift'
import StoredEntities from './stored-entities'
import { Mutex, MutexInterface, withTimeout } from 'async-mutex'
import SavedStateHandler from './saved-state-handler'

export default class API {
	static ACADEMIC_TERM = '2020/2021'
	static SEMESTER = 2
	static LANG = 'pt-PT'
	static PREFIX = ''
	static PATH_PREFIX = ''
	static REQUEST_CACHE = StoredEntities
	static MUTEXES: Record<string, MutexInterface> = {}

	private static MUTEX_TIMEOUT = 5000

	public static setMutexes(): void {
		const mutexKeys = [
			'mutex-creation',
			'academic-terms',
			'degrees'
		]
		// mutexKeys.forEach(k => this.MUTEXES[k] = new Mutex())
		mutexKeys.forEach(k => this.MUTEXES[k] = withTimeout(new Mutex(), this.MUTEX_TIMEOUT))
	}

	private static async createMutex(mutexId: string): Promise<MutexInterface> {
		const mutexKey = 'mutex-creation'
		const mutex = this.MUTEXES[mutexKey]

		// Check previously if already created
		if (this.MUTEXES[mutexId] !== undefined) return this.MUTEXES[mutexId]

		// Acquire mutex for creation
		const releaser: MutexInterface.Releaser = await mutex.acquire()

		// If mutex already exists, return it
		if (this.MUTEXES[mutexId] !== undefined) {
			releaser()
			return this.MUTEXES[mutexId]
		}
		
		// Create new mutex
		this.MUTEXES[mutexId] = withTimeout(new Mutex(), this.MUTEX_TIMEOUT)

		// Release lock
		releaser()
		return this.MUTEXES[mutexId]
	}

	// eslint-disable-next-line
	private static async getRequest(url: string, academicTermId: string | undefined): Promise<any> {
		let urlToFetch = `${API.PATH_PREFIX}${url}?lang=${this.LANG}`

		if (academicTermId !== undefined) {
			urlToFetch += `&academicTerm=${academicTermId}`
		}

		return fetch(urlToFetch).then(r => {
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

	public static async getDegrees(academicTermId: string | undefined): Promise<Degree[] | null> {
		// Check if degrees already exist for this academicTerm
		let prevDegrees = this.REQUEST_CACHE.getAllDegrees(academicTermId || '')
		if (prevDegrees.length > 0) return prevDegrees

		// LOCK HERE to avoid repeating the same request N times
		const mutexKey = 'degrees'
		const mutex = this.MUTEXES[mutexKey]
		let releaser: undefined | MutexInterface.Releaser = undefined
		try {
			releaser = await mutex.acquire()
		} catch (err) {
			console.error('Fenix API taking too long...')
			return []
		}

		// Check if degrees already exist for this academicTerm
		prevDegrees = this.REQUEST_CACHE.getAllDegrees(academicTermId || '')
		if (prevDegrees.length > 0) {
			releaser()
			return prevDegrees
		}

		// This should use the endpoint /api/degrees, but using this one because the other is too large
		const res = (await this.getRequest('/api/degrees/all', academicTermId) as DegreeDto[] | null)
		if (res === null) {
			releaser()
			return null
		}
		const degrees = res.map((d: DegreeDto) => new Degree(d))
			.filter((d: Degree) => d.academicTerms.includes(API.ACADEMIC_TERM))

		const sortedDegrees = degrees.sort(Degree.compare)

		// Store degrees
		sortedDegrees.forEach(degree => this.REQUEST_CACHE.storeDegree(degree, academicTermId || ''))

		// RELEASE LOCK HERE
		releaser()
		return sortedDegrees
	}

	public static async getCourses(degree: Degree, academicTermId: string | undefined): Promise<Course[] | null> {
		// Check if courses already exist for this academicTerm and degree
		let prevCourses = this.REQUEST_CACHE.getDegreeCourses(degree, academicTermId || '')
		if (prevCourses.length > 0) return prevCourses

		// LOCK HERE to avoid repeating the same request N times
		const mutexKey = `degree-${degree.id}`
		// Create/find mutex for this degree
		const mutex = await this.createMutex(mutexKey)
		let releaser: undefined | MutexInterface.Releaser = undefined
		try {
			releaser = await mutex.acquire()
		} catch (err) {
			console.error(err)
			console.error('Fenix API taking too long...')
			return []
		}

		// Check if courses already exist for this academicTerm and degree
		prevCourses = this.REQUEST_CACHE.getDegreeCourses(degree, academicTermId || '')
		if (prevCourses.length > 0) {
			releaser()
			return prevCourses
		}

		const res = (await this.getRequest(`/api/degrees/${degree.id}/courses`, academicTermId) as CourseDto[] | null)
		if (res === null) {
			releaser()
			return null
		}
		const courses = res
			.map((d: CourseDto) => Course.fromDto(d, degree.acronym))
			.filter((c: Course) => {
				return c.semester === this.SEMESTER
			})

		const sortedCourses = courses.sort(Course.compare)

		// Store in cache for future use
		sortedCourses.forEach(c => this.REQUEST_CACHE.storeCourse(c, academicTermId || ''))

		// RELEASE LOCK HERE
		releaser()
		return sortedCourses
	}

	public static async getCourse(course: string, degreeAcronyms: string[], academicTermId: string | undefined): Promise<Course | null> {
		// Check if courses already exist for this academicTerm and degree
		let prevCourse = this.REQUEST_CACHE.getCourse(course, academicTermId || '')
		if (prevCourse !== undefined) return prevCourse

		// LOCK HERE to avoid repeating the same request N times
		const mutexKey = `course-${course}`
		// Create/find mutex for this degree
		const mutex = await this.createMutex(mutexKey)
		let releaser: undefined | MutexInterface.Releaser = undefined
		try {
			releaser = await mutex.acquire()
		} catch (err) {
			console.error(err)
			console.error('Fenix API taking too long...')
			return null
		}

		// Check if courses already exist for this academicTerm and degree
		prevCourse = this.REQUEST_CACHE.getCourse(course, academicTermId || '')
		if (prevCourse !== undefined) {
			releaser()
			return prevCourse
		}

		const res = (await this.getRequest(`/api/courses/${course}`, academicTermId) as CourseDto | null)
		if (res === null) {
			releaser()
			return null
		}
		res.id = course
		let courseAcronyms = ''
		if (res.competences !== undefined && res.competences.length > 0 && res.competences[0] !== undefined
			&& res.competences[0].degrees !== undefined && res.competences[0].degrees.length > 0
		) {
			courseAcronyms = res.competences[0].degrees.map(d => d.acronym).join('/')
		}
		const newCourse = Course.fromDto(res, courseAcronyms)
		// Update degree acronyms
		newCourse.updateDegree(degreeAcronyms)

		// Store in cache for future use
		this.REQUEST_CACHE.storeCourse(newCourse, academicTermId || '')

		// RELEASE LOCK HERE
		releaser()
		return newCourse
	}

	public static async getCourseSchedules(course: Course, academicTermId: string | undefined, forceUpdate = false): Promise<Shift[] | null> {
		// Check if courses already exist for this academicTerm and degree
		let prevSchedules = this.REQUEST_CACHE.getCourseShifts(course, academicTermId || '')
		if (!forceUpdate && prevSchedules.length > 0) return prevSchedules

		// LOCK HERE to avoid repeating the same request N times
		const mutexKey = `shifts-course-${course.id}`
		// Create/find mutex for this degree
		const mutex = await this.createMutex(mutexKey)
		let releaser: undefined | MutexInterface.Releaser = undefined
		try {
			releaser = await mutex.acquire()
		} catch (err) {
			console.error(err)
			console.error('Fenix API taking too long...')
			return null
		}

		prevSchedules = this.REQUEST_CACHE.getCourseShifts(course, academicTermId || '')
		if (!forceUpdate && prevSchedules.length > 0) {
			releaser()
			return prevSchedules
		}

		const res = await this.getRequest(`/api/courses/${course.id}/schedule`, academicTermId) as ScheduleDto | null
		if (res === null) {
			console.error('can\'t get course schedule')
			releaser()
			return null
		}
		// course might be unselected because of async
		if (!course.isSelected) {
			releaser()
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
			releaser()
			return []
		}
		course.saveShifts()

		// Store in cache for future use
		shifts.forEach(shift => shift !== null && this.REQUEST_CACHE.storeShift(shift, course.id, academicTermId || ''))

		// RELEASE LOCK HERE
		releaser()

		return shifts as Shift[]
	}

	public static async getAcademicTerms(): Promise<AcademicTerm[]> {
		// Cache the academic terms
		if (staticData.terms.length > 0) {
			return staticData.terms
		}

		// LOCK HERE to avoid repeating the same request N times
		const mutexKey = 'academic-terms'
		const mutex = this.MUTEXES[mutexKey]
		let releaser: undefined | MutexInterface.Releaser = undefined
		try {
			releaser = await mutex.acquire()
		} catch (err) {
			console.error('Fenix API taking too long...')
			return []
		}

		// Check again after getting the lock
		if (staticData.terms.length > 0) {
			releaser()
			return staticData.terms
		}

		const res = (await this.getRequest('/api/academicterms', undefined)) as [] | null
		if (res === null) {
			releaser()
			return []
		}
		// Prepare from array of [string, [string, string]] to array of string
		// Keep only the current and previous years
		staticData.terms = Object.entries(res)
			.sort()
			.reverse()
			.slice(0, 2)
			.map((arr) => arr[1])
			.flat()
			.map((s) => new AcademicTerm(s as string))
			.sort(AcademicTerm.compare)

		// RELEASE LOCK HERE after fetching and storing terms
		releaser()
		return staticData.terms
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
	terms: [] as AcademicTerm[],
	currentTerm: undefined as AcademicTerm | undefined
}

export async function defineCurrentTerm(): Promise<void> {
	// Fetch ongoing term
	const today = new Date()
	let currentYear = today.getFullYear()
	const currentMonth = today.getMonth() + 1 // Month starts at 0

	let currentTerm = '', semester = 0
	// First semester (Between September and January)
	if (currentMonth <= 1 || currentMonth >= 9) {
		if (currentMonth <= 1) currentYear -= 1
		currentTerm = `${currentYear}/${currentYear + 1}`
		semester = 1
	}
	// Second semester (Between February and August)
	else {
		currentTerm = `${currentYear - 1}/${currentYear}`
		semester = 2
	}

	API.ACADEMIC_TERM = currentTerm
	API.SEMESTER = semester

	const currTerms = await API.getAcademicTerms()
	const selectedTerm = currTerms.find((t) => t.semester == semester && t.term == currentTerm)
	staticData.currentTerm = selectedTerm
	StoredEntities.setMissingAcademicTermId(selectedTerm?.id || '')
	SavedStateHandler.getInstance().getCurrentTimetables().forEach(t => {
		if (t.academicTerm === '') t.academicTerm = selectedTerm?.id || ''
	})
}

const languages = new Map([
	['en', 'en-GB'],
	['pt', 'pt-PT']
])

