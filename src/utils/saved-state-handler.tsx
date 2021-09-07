import Cookies from 'universal-cookie'
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

	static MAX_AGE_NORMAL = 60*60*24*31*3 // 3 months
	static MAX_AGE_SMALL = 60*60*24 // 1 day

	static PARAMS_SEP = ';'
	static ARGS_SEP = '~'

	// ATTRIBUTES
	private shifts: string
	private degrees: string
	private cookies = new Cookies()

	constructor(urlParams: Record<string, string>) {
		this.shifts = urlParams[SavedStateHandler.SHIFTS] ?? this.getLocalStorage(SavedStateHandler.SHIFTS)
		this.degrees = urlParams[SavedStateHandler.DEGREES] ?? this.getCookie(SavedStateHandler.DEGREES)
	}

	// CLASS METHODS
	// Updates user URL to use or not the state
	static async changeUrl(toState: boolean, selectedShifts: Shift[]): Promise<void> {
		const title: string = document.title
		let path = API.PATH_PREFIX + '/'
		if (toState) {
			const shifts = shortenDescriptions(selectedShifts)
			if (shifts !== '') path += `?${this.SHIFTS}=${shifts}`

			const degrees = getDegreesAcronyms(selectedShifts)
			if (degrees !== '') path += `&${this.DEGREES}=${degrees}`
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
			this.degrees = this.getCookie(SavedStateHandler.DEGREES)
		}
		return this.degrees?.split(SavedStateHandler.PARAMS_SEP)
	}

	setShifts(selectedShifts: Shift[]): void {
		if (selectedShifts.length === 0) {
			this.cookies.remove(SavedStateHandler.SHIFTS)
			this.cookies.remove(SavedStateHandler.DEGREES)
		} else {
			this.shifts = shortenDescriptions(selectedShifts)
			// this.cookies.set(SavedStateHandler.SHIFTS, this.shifts, { maxAge: SavedStateHandler.MAX_AGE_NORMAL })
			this.setLocalStorage(SavedStateHandler.SHIFTS, this.shifts)

			this.degrees = getDegreesAcronyms(selectedShifts) || ''
			this.cookies.set(SavedStateHandler.DEGREES, this.degrees, { maxAge: SavedStateHandler.MAX_AGE_NORMAL })
		}
	}

	async getShifts(): Promise<[CourseUpdates, ShiftState] | undefined> {
		if (!this.shifts) {
			return undefined
		}
		const shifts = this.shifts.split(SavedStateHandler.PARAMS_SEP)
			.map((shift: string) => shift.split(SavedStateHandler.ARGS_SEP))

		const courseUpdate = new CourseUpdates()
		const parsedState = await Promise.all(shifts.map(async (description: string[]) => this.buildCourse(description, courseUpdate)))

		const state = parsedState.reduce((acc: ShiftState, result: BuiltCourse) => {
			acc.availableShifts = acc.availableShifts.concat(result.availableShifts)
			acc.selectedShifts = acc.selectedShifts.concat(result.selectedShifts)
			return acc
		}, { availableShifts: [], selectedShifts: [] } as ShiftState)

		return [courseUpdate, state]
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

	// HELPERS

	private async buildCourse(description: string[], updates: CourseUpdates): Promise<BuiltCourse> {
		const course = await API.getCourse(description[0])
		if (!course) {
			throw 'Could not build course'
		}

		if (updates.has(course)) {
			throw 'Repeated course on URL'
		}

		// Set course as selected
		updates.toggleCourse(course)

		// Get the course schedules
		const availableShifts = await API.getCourseSchedules(course)
		if (!availableShifts) {
			throw 'Could not fetch course schedule'
		}

		// Set selected shifts for the course
		const selectedShiftIds = description.slice(1)
		const selectedShifts = availableShifts.reduce((acc: Shift[], shift: Shift) => {
			if (selectedShiftIds.includes(shift.shiftId)) {
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

	private setCookie(accessor: string, value: string | boolean, maxAge: number) {
		this.cookies.set(accessor, value, { maxAge })
	}

	private getLocalStorage(accessor: string): string {
		return localStorage.getItem(accessor) ?? ''
	}

	private setLocalStorage(accessor: string, value: string): void {
		localStorage.setItem(accessor, value)
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