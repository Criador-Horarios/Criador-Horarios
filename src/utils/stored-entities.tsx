import Course from '../domain/Course'
import Degree from '../domain/Degree'

export default class StoredEntities {
	// SINGLETON
	private static instance: StoredEntities

	// ATTRIBUTES
	private degrees: Record<string, Degree> = {}
	public courses: Record<string, Course> = {}

	// CLASS METHODS
	private static getInstance(): StoredEntities {
		if (!StoredEntities.instance) {
			StoredEntities.instance = new StoredEntities()
		}

		return StoredEntities.instance
	}

	// Degrees
	public static storeDegree(degree: Degree): void {
		const degrees = this.getInstance().degrees
		degrees[degree.id] = degree
	}

	public static getDegrees(degreeIds: string[]): Degree[] {
		const degrees = this.getInstance().degrees
		return degreeIds.map(id => degrees[id]).filter(d => d !== undefined)
	}

	// Degrees
	public static storeCourse(course: Course): void {
		const courses = this.getInstance().courses
		courses[course.id] = course
	}

	public static getCourses(coursesIds: string[]): Course[] {
		const courses = this.getInstance().courses
		return coursesIds.map(id => courses[id]).filter(c => c !== undefined)
	}
}