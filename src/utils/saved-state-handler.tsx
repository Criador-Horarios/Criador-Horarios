import Cookies from 'universal-cookie'
import { Comparables } from '../domain/Comparable'
import Course from '../domain/Course'
import Shift, { getDegreesAcronyms, shortenDescriptions } from '../domain/Shift'
import API from './api'
import CourseUpdates from './CourseUpdate'

export default class SavedStateHandler {
	// CONSTANTS
	static DEGREES = 'd'
	static SHIFTS = 's'
	static DARK = 'dark'
	static LANGUAGE = 'language'
	static WARNING = 'warning'
	static COLORS = 'colors'
	static IS_MULTISHIFT = 'ismulti'

	static MAX_AGE_NORMAL = 60*60*24*31*3 // 3 months
	static MAX_AGE_SMALL = 60*60*24 // 1 day

	static PARAMS_SEP = ';'
	static ARGS_SEP = '~'

	// ATTRIBUTES
	private shifts: string
	private degrees: string
	private colors: Record<string, string>
	private multiShiftMode: boolean
	private cookies = new Cookies()

	constructor(urlParams: Record<string, string>) {
		this.shifts = urlParams[SavedStateHandler.SHIFTS] ?? this.getLocalStorage(SavedStateHandler.SHIFTS) ??
			this.getCookie(SavedStateHandler.SHIFTS)
		this.degrees = urlParams[SavedStateHandler.DEGREES] ?? this.getLocalStorage(SavedStateHandler.DEGREES) ??
			this.getCookie(SavedStateHandler.DEGREES)
		this.colors = (this.getLocalStorage(SavedStateHandler.COLORS, true) ?? {}) as Record<string, string>
		this.multiShiftMode = (urlParams[SavedStateHandler.IS_MULTISHIFT] ?? this.getLocalStorage(SavedStateHandler.IS_MULTISHIFT)) === 'true'
	}

	// CLASS METHODS
	// Updates user URL to use or not the state
	static async changeUrl(toState: boolean, selectedShifts: Shift[], multiShiftMode: boolean): Promise<void> {
		const title: string = document.title
		let path = API.PATH_PREFIX + '/'
		if (toState) {
			const shifts = shortenDescriptions(selectedShifts)
			if (shifts !== '') path += `?${this.SHIFTS}=${shifts}`

			const degrees = getDegreesAcronyms(selectedShifts)
			if (degrees !== '') path += `&${this.DEGREES}=${degrees}`

			if (multiShiftMode) path += `&${this.IS_MULTISHIFT}=true`
		}

		if (window.history.replaceState) {
			window.history.replaceState({}, title, path)
		} else {
			window.history.pushState({}, title, path)
		}
	}

	// INSTANCE METHODS
	// Returns the degrees acronyms, like MEIC-A
	getDegrees(forceUpdate = false): string[] | undefined {
		if (forceUpdate) {
			this.degrees = this.getLocalStorage(SavedStateHandler.DEGREES) as string
		}
		return this.degrees?.split(SavedStateHandler.PARAMS_SEP)
	}

	setShifts(selectedShifts: Shift[]): void {
		if (selectedShifts.length === 0) {
			this.removeLocalStorage(SavedStateHandler.SHIFTS)
			this.removeLocalStorage(SavedStateHandler.DEGREES)
			this.removeLocalStorage(SavedStateHandler.COLORS)
		} else {
			this.shifts = shortenDescriptions(selectedShifts)
			this.setLocalStorage(SavedStateHandler.SHIFTS, this.shifts)

			this.degrees = getDegreesAcronyms(selectedShifts) || ''
			this.setLocalStorage(SavedStateHandler.DEGREES, this.degrees)

			// Store colors
			const courses = Comparables.toUnique(selectedShifts.map(s => s.course)) as Course[]
			this.setCoursesColor(courses)
		}
	}

	async getShifts(): Promise<[CourseUpdates, ShiftState, string] | undefined> {
		const errors: string[] = []
		if (!this.shifts) {
			return undefined
		}
		const shifts = this.shifts.split(SavedStateHandler.PARAMS_SEP)
			.map((shift: string) => shift.split(SavedStateHandler.ARGS_SEP))

		const courseUpdate = new CourseUpdates()
		const parsedState = await Promise.all(shifts.map(async (description: string[]) => {
			try {
				return await this.buildCourse(description, courseUpdate)
			} catch (err) {
				// Values not well parsed, but keeps parsing the rest
				errors.push(err as string)
				console.error(err)
				return undefined
			}
		}))

		const state = parsedState.reduce((acc: ShiftState, result: BuiltCourse | undefined) => {
			if (result) {
				acc.availableShifts = acc.availableShifts.concat(result.availableShifts)
				acc.selectedShifts = acc.selectedShifts.concat(result.selectedShifts)
			}
			return acc
		}, { availableShifts: [], selectedShifts: [] } as ShiftState)

		return [courseUpdate, state, errors.join(', ')]
	}

	setMultiShiftMode(multiShiftMode: boolean): void {
		this.multiShiftMode = true
		this.setLocalStorage(SavedStateHandler.IS_MULTISHIFT, multiShiftMode.toString())
	}

	getMultiShiftMode(): boolean {
		return this.multiShiftMode
	}

	getDarkMode(): boolean | null {
		const darkName = this.getCookie(SavedStateHandler.DARK) ?? null
		if (darkName == null) return null
		return darkName === 'true'
	}

	setDarkMode(isDark: boolean): void {
		this.cookies.set(SavedStateHandler.DARK, isDark, { maxAge: SavedStateHandler.MAX_AGE_NORMAL })
	}

	getLanguage(): string {
		return this.getCookie(SavedStateHandler.LANGUAGE)
	}

	setLanguage(language: string): void {
		this.cookies.set(SavedStateHandler.LANGUAGE, language, { maxAge: SavedStateHandler.MAX_AGE_NORMAL })
	}

	getWarning(): boolean {
		return this.getCookie(SavedStateHandler.WARNING) == 'true'
	}

	setWarning(warning: boolean): void {
		this.cookies.set(SavedStateHandler.WARNING, warning, { maxAge: SavedStateHandler.MAX_AGE_SMALL })
	}

	setCoursesColor(courses: Course[]): void {
		courses.forEach(c => {
			this.colors[c.id] = c.color
		})

		this.setLocalStorage(SavedStateHandler.COLORS, this.colors, true)
	}

	// HELPERS

	private async buildCourse(description: string[], updates: CourseUpdates): Promise<BuiltCourse> {
		const course = await API.getCourse(description[0])
		if (!course) {
			throw 'Could not build course'
		}

		if (updates.has(course)) {
			throw 'Repeated course on URL'
		}

		// Check if has a previous color and set it
		const currColor = this.colors[course.id]
		const hasColor = (currColor && currColor !== '') as boolean
		if (hasColor) {
			course.setColor(currColor)
		}

		// Set course as selected
		updates.toggleCourse(course, hasColor)

		// Get the course schedules
		const availableShifts = await API.getCourseSchedules(course)
		if (!availableShifts) {
			throw 'Could not fetch course schedule'
		}

		// Set selected shifts for the course
		const selectedShiftIds = description.slice(1)
		const selectedShifts = availableShifts.reduce((acc: Shift[], shift: Shift) => {
			if (selectedShiftIds.includes(shift.getStoredId())) {
				acc.push(shift)
				course.addSelectedShift(shift)
			}
			return acc
		}, [] as Shift[])
		return { course, availableShifts, selectedShifts }
	}

	private getCookie(accessor: string): string {
		return this.cookies.get(accessor)
	}

	private setCookie(accessor: string, value: string | boolean, maxAge = SavedStateHandler.MAX_AGE_NORMAL) {
		this.cookies.set(accessor, value, { maxAge })
	}

	private getLocalStorage(accessor: string, formatJson = false): string | Record<string, string> {
		const value = localStorage.getItem(accessor)
		if (formatJson && value) {
			return JSON.parse(value) 
		}
		return value as string
	}

	private setLocalStorage(accessor: string, value: string | Record<string, string>, formatJson = false): void {
		if (formatJson) {
			value = JSON.stringify(value)
		}
		localStorage.setItem(accessor, value as string)
	}

	private removeLocalStorage(accessor: string): void {
		localStorage.removeItem(accessor)
	}
}

export type BuiltCourse = {
	course: Course,
	availableShifts: Shift[],
	selectedShifts: Shift[]
}

export type ShiftState = {
	availableShifts: Shift[],
	selectedShifts: Shift[]
}