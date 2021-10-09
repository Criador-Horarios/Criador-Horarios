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
		this.shifts = urlParams[SavedStateHandler.SHIFTS] ?? this.getLocalStorage(SavedStateHandler.SHIFTS)
		this.degrees = urlParams[SavedStateHandler.DEGREES] ?? this.getLocalStorage(SavedStateHandler.DEGREES)
		this.colors = (this.getLocalStorage(SavedStateHandler.COLORS) ?? {}) as Record<string, string>
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
		this.multiShiftMode = multiShiftMode
		this.setLocalStorage(SavedStateHandler.IS_MULTISHIFT, multiShiftMode.toString())
	}

	getMultiShiftMode(): boolean {
		return this.multiShiftMode
	}

	getDarkMode(): boolean {
		return this.getLocalStorage(SavedStateHandler.DARK) as boolean
	}

	setDarkMode(isDark: boolean): void {
		this.setLocalStorage(SavedStateHandler.DARK, isDark.toString())
	}

	getLanguage(): string {
		return this.getLocalStorage(SavedStateHandler.LANGUAGE) as string
	}

	setLanguage(language: string): void {
		this.setLocalStorage(SavedStateHandler.LANGUAGE, language)
	}

	// TODO: Move to localStorage
	getWarning(): boolean {
		return this.getCookie(SavedStateHandler.WARNING) == 'true'
	}

	// TODO: Move to localStorage
	setWarning(warning: boolean): void {
		this.cookies.set(SavedStateHandler.WARNING, warning, { maxAge: SavedStateHandler.MAX_AGE_SMALL })
	}

	setCoursesColor(courses: Course[]): void {
		courses.forEach(c => {
			this.colors[c.id] = c.color
		})

		this.setLocalStorage(SavedStateHandler.COLORS, this.colors, {})
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

	private getLocalStorage(accessor: string): boolean | string | Record<string, string> {
		const value = localStorage.getItem(accessor)
		if (value) {
			try {
				const storedValue = JSON.parse(value)
				// Backwards compatibility
				if (storedValue.version == undefined) {
					this.migrateLocalStorageToVersion1(accessor)
					return storedValue
				}
				else if (storedValue.version == 1) return storedValue.value
			}
			catch (e) {
				// Not yet updated, keep going
				this.migrateLocalStorageToVersion1(accessor)
			}
		}
		return value as string
	}

	// 
	private setLocalStorage(
		accessor: string, value: string | Record<string, string>, options: Partial<LocalStorageOptions> = {}
	): void {
		const jsonValue = {
			value: value,
			version: LOCAL_STORAGE_VERSION,
			maxAge: options.maxAge
		} as LocalStorageV1

		localStorage.setItem(accessor, JSON.stringify(jsonValue))
	}

	private removeLocalStorage(accessor: string): void {
		localStorage.removeItem(accessor)
	}

	private migrateLocalStorageToVersion1(accessor: string): void {
		console.log(accessor)
		const value = localStorage.getItem(accessor)
		const newRes = { version: LOCAL_STORAGE_VERSION } as LocalStorageV1

		if (value) {
			try {
				const storedValue = JSON.parse(value)
				// It is json, but not in the new version
				if (storedValue.version == undefined) newRes.value = storedValue
			}
			catch (e) {
				// It isn't json
				newRes.value = value
			}
		}

		localStorage.setItem(accessor, JSON.stringify(newRes))
	}
}

type LocalStorageOptions = {
	maxAge: number
}

type LocalStorageV1 = {
	value: string | Record<string, string>,
	version: number,
	maxAge?: number
}

const LOCAL_STORAGE_VERSION = 1

export type BuiltCourse = {
	course: Course,
	availableShifts: Shift[],
	selectedShifts: Shift[]
}

export type ShiftState = {
	availableShifts: Shift[],
	selectedShifts: Shift[]
}