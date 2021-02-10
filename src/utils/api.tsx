import Shift, { ShiftDto } from '../domain/Shift'
import Degree, { DegreeDto } from '../domain/Degree'
import Course, { CourseDto } from '../domain/Course'
import { ScheduleDto } from '../domain/Schedule'

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
		const res = (await this.getRequest(`/api/degrees?academicTerm=${this.ACADEMIC_TERM}`) as DegreeDto[] | null)
		if (res === null) {
			return null
		}
		const degrees = res.map((d: DegreeDto) => new Degree(d))
		degrees.sort(Degree.compare)
		return degrees
	}

	public static async getCourses(degree: string): Promise<Course[] | null> {
		const res = (await this.getRequest(`/api/degrees/${degree}/courses?academicTerm=${this.ACADEMIC_TERM}`) as CourseDto[] | null)
		if (res === null) {
			return null
		}
		const courses = res
			.map((d: CourseDto) => new Course(d))
			.filter( (c: Course) => {
				// FIXME: hardcoded
				return c.semester === 2
			})
		courses.sort(Course.compare)
		return courses
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
		const res = await this.getRequest(`/api/courses/${course.id}/schedule?academicTerm=${this.ACADEMIC_TERM}`) as ScheduleDto | null
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

	public static async getShortUrl(state: string): Promise<string> {
		return `${window.location.href}/?s=${state}`
			.replace('//', '/')
			.replace(':/', '://')
	}
}