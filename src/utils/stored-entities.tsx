import Course from '../domain/Course'
import Degree from '../domain/Degree'
import Shift from '../domain/Shift'

export default class StoredEntities {
	// SINGLETON
	private static instance: Record<string, StoredEntities> = {}

	// ATTRIBUTES
	private degrees: Record<string, Degree> = {}
	private courses: Record<string, Course> = {}
	private coursesByDegree: Record<string, Set<string>> = {}
	private courseShifts: Record<string, Record<string, Shift>> = {}

	// CLASS METHODS
	private static getInstance(academicTermId: string | undefined): StoredEntities {
		const usedId = typeof academicTermId === 'string' ? academicTermId : ''
		if (!StoredEntities.instance[usedId]) {
			StoredEntities.instance[usedId] = new StoredEntities()
		}

		return StoredEntities.instance[usedId]
	}

	public static setMissingAcademicTermId(academicTermId: string): void {
		const missingInstance = StoredEntities.getInstance('')
		// delete this.instance[''] // Should delete it I guess
		// TODO: Check if we need to merge both
		this.instance[academicTermId] = missingInstance
	}

	// Degrees
	public static storeDegree(degree: Degree, academicTermId: string | undefined = undefined): void {
		const degrees = this.getInstance(academicTermId).degrees
		degrees[degree.id] = degree
	}

	public static getDegrees(degreeIds: string[], academicTermId: string | undefined = undefined): Degree[] {
		const degrees = this.getInstance(academicTermId).degrees
		return degreeIds.map(id => degrees[id]).filter(d => d !== undefined)
	}

	public static getAllDegrees(academicTermId: string | undefined = undefined): Degree[] {
		return Object.values(this.getInstance(academicTermId).degrees)
	}

	// Courses
	public static storeCourse(course: Course, academicTermId: string | undefined = undefined): void {
		const currInstance = this.getInstance(academicTermId)
		const courses = currInstance.courses
		courses[course.id] = course

		currInstance.coursesByDegree[course.degreeAcronym] = currInstance.coursesByDegree[course.degreeAcronym] || new Set
		currInstance.coursesByDegree[course.degreeAcronym].add(course.id)
	}

	public static getCourses(coursesIds: string[], academicTermId: string | undefined = undefined): Course[] {
		const courses = this.getInstance(academicTermId).courses
		return coursesIds.map(id => courses[id]).filter(c => c !== undefined)
	}

	public static getCourse(courseId: string, academicTermId: string | undefined = undefined): Course | undefined {
		const courses = this.getInstance(academicTermId).courses
		return courses[courseId]
	}

	public static getDegreeCourses(degree: Degree, academicTermId: string | undefined = undefined): Course[] {
		const currInstance = this.getInstance(academicTermId)
		const courses = currInstance.coursesByDegree[degree.acronym] =
			currInstance.coursesByDegree[degree.acronym] || new Set()
		if (courses.size === 0) return []
		else {
			const existingCourses = Array.from(courses).map(courseId => currInstance.courses[courseId])
			if (existingCourses.find(c => c === undefined)) return []
			else return existingCourses
		}
	}
	
	// Shifts
	public static storeShift(shift: Shift, courseId: string, academicTermId: string | undefined = undefined): void {
		const currInstance = this.getInstance(academicTermId)
		const courseShifts = currInstance.courseShifts[courseId] = currInstance.courseShifts[courseId] || {}
		courseShifts[shift.name] = shift
	}

	public static getShift(courseId: string, shiftId: string, academicTermId: string | undefined = undefined): Shift | undefined {
		return this.getInstance(academicTermId).courseShifts[courseId][shiftId]
	}

	public static getShifts(courseShiftIds: Record<string, string[]>, academicTermId: string | undefined = undefined): Shift[] {
		let returnedShifts: Shift[] = []
		const currInstance = this.getInstance(academicTermId)
		Object.entries(courseShiftIds).forEach(([courseId, shiftIds]) => {
			const courseShifts = currInstance.courseShifts[courseId]
			const shifts = shiftIds.map(shiftId => courseShifts[shiftId])
			returnedShifts = returnedShifts.concat(shifts)
		})
		return returnedShifts
	}

	public static getCourseShifts(course: Course, academicTermId: string | undefined = undefined): Shift[] {
		return Object.values(this.getInstance(academicTermId).courseShifts[course.id] || {}).filter(s => s !== undefined)
	}

}