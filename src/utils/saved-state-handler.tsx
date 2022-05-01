import Cookies from 'universal-cookie'
import AcademicTerm from '../domain/AcademicTerm'
import { Comparables } from '../domain/Comparable'
import Course from '../domain/Course'
import Shift, { getDegreesAcronyms, shortenDescriptions } from '../domain/Shift'
import Timetable from '../domain/Timetable'
import API from './api'
import CourseUpdates from './CourseUpdate'

import i18next from 'i18next'

export default class SavedStateHandler {
	// CONSTANTS
	// Storage keys
	static DEGREES = 'd'
	static SHIFTS = 's'
	static TERM = 'term'
	static DARK = 'dark'
	static LANGUAGE = 'language'
	static WARNING = 'warning'
	static COLORS = 'colors'
	static IS_MULTISHIFT = 'ismulti'
	static SAVED_TIMETABLES = 'saved-timetables'
	static DEBUG = 'debug'
	
	// 
	static DOMAIN = process.env.REACT_APP_URL
	static MAX_AGE_NORMAL = 60*60*24*31*3 // 3 months - UNUSED
	static AGE_WARNING = 60*60*24*2 // 2 days

	static PARAMS_SEP = ';'
	static ARGS_SEP = '~'

	// SINGLETON
	private static instance: SavedStateHandler

	// ATTRIBUTES
	private shifts: string
	private degrees: string
	private colors: Record<string, string>
	private savedTimetables: Timetable[] = []
	private multiShiftMode: boolean
	private cookies = new Cookies()
	private debug: boolean

	private constructor(urlParams: Record<string, string>) {
		this.shifts = urlParams[SavedStateHandler.SHIFTS] ?? this.getLocalStorage(SavedStateHandler.SHIFTS)
		this.degrees = urlParams[SavedStateHandler.DEGREES] ?? this.getLocalStorage(SavedStateHandler.DEGREES)
		this.colors = (this.getLocalStorage(SavedStateHandler.COLORS) ?? {}) as Record<string, string>
		this.savedTimetables = this.getCurrentTimetables()
		this.multiShiftMode = (urlParams[SavedStateHandler.IS_MULTISHIFT] ?? this.getLocalStorage(SavedStateHandler.IS_MULTISHIFT)) === 'true'
		this.debug = urlParams[SavedStateHandler.DEBUG] == 'true'
	}

	// CLASS METHODS
	public static getInstance(options: Record<string, string> = {}): SavedStateHandler {
		if (!SavedStateHandler.instance) {
			SavedStateHandler.instance = new SavedStateHandler(options)
		}

		return SavedStateHandler.instance
	}

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

	static getAppURL(params: string[]): string {
		return `${SavedStateHandler.DOMAIN}?${params.join('&')}`
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

	async getShifts(unparsedShifts: string | undefined = undefined, degreesChosen: Set<string> = new Set):
		Promise<[CourseUpdates, ShiftState, string] | undefined> {
		const errors: string[] = []
		const shiftsToParse = unparsedShifts
		if (!shiftsToParse) {
			const courseUpdate = new CourseUpdates()
			courseUpdate.degreeAcronyms = degreesChosen
			return [courseUpdate, { availableShifts: [], selectedShifts: []}, '']
		}

		// TODO: Build cache of shifts to avoid asking repeatedly
		const shifts = shiftsToParse.split(SavedStateHandler.PARAMS_SEP)
			.map((shift: string) => shift.split(SavedStateHandler.ARGS_SEP))

		const courseUpdate = new CourseUpdates()
		courseUpdate.degreeAcronyms = degreesChosen

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

	setSavedTimetables(timetables: Timetable[]): void {
		// Mark every timetable has saved
		timetables.forEach(t => t.save())
		
		const convertedTimetables: Record<string, string> = {}
		timetables.map((t, index) => convertedTimetables[index] = t.toString())
		
		this.setLocalStorage(SavedStateHandler.SAVED_TIMETABLES, convertedTimetables)
		this.savedTimetables = timetables
	}

	getCurrentTimetables(): Timetable[] {
		const current = this.savedTimetables
		return current.length === 0 ? [new Timetable(i18next.t('default-timetable'), [], false, false)] : this.savedTimetables
	}
	
	async getSavedTimetables(): Promise<Timetable[]> {
		const localTimetables = this.getLocalStorage(SavedStateHandler.SAVED_TIMETABLES)

		// If there are none stored
		if (!localTimetables) {
			return this.getCurrentTimetables()
		}

		// TODO: First time should only fetch the first timetable to avoid getting unused timetables
		const parsedTimetables = await Promise.all(Object.values(localTimetables).map(async (unparsedTimetable: string) => {
			return await Timetable.fromString(unparsedTimetable)
		}))

		const usableTimetables = parsedTimetables.filter((t) => t !== undefined) as Timetable[]

		this.savedTimetables = usableTimetables
		return usableTimetables.length === 0 ? this.getCurrentTimetables() : usableTimetables
	}

	// Returns if true in the right domain and false otherwise
	getNewDomain(): boolean {
		const currOrigin = window.location.origin
		const rightOrigin = SavedStateHandler.DOMAIN
		return currOrigin == rightOrigin
	}

	getTerm(): string | null {
		return this.getLocalStorage(SavedStateHandler.TERM) as (string | null)
	}

	setTerm(term: AcademicTerm): void {
		this.setLocalStorage(SavedStateHandler.TERM, term.id)
	}

	getDarkMode(): boolean {
		return this.getLocalStorage(SavedStateHandler.DARK) == 'true'
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

	getWarning(): boolean {
		return this.getLocalStorage(SavedStateHandler.WARNING) == 'true'
	}

	setWarning(warning: boolean): void {
		this.setLocalStorage(SavedStateHandler.WARNING, warning.toString(), { maxAge: SavedStateHandler.AGE_WARNING })
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
		
		// Update course to have the selected degrees
		const selectedDegrees = Array.from(updates.degreeAcronyms)
		course.updateDegree(selectedDegrees)

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

	private getLocalStorage(accessor: string): string | Record<string, string> {
		const value = localStorage.getItem(accessor)
		if (value) {
			try {
				const storedValue = JSON.parse(value)
				// Backwards compatibility
				if (storedValue.version == undefined) {
					this.migrateLocalStorageToVersion1(accessor)
					return storedValue.toString()
				}
				else if (storedValue.version == 1) {
					const parsedValue = storedValue as LocalStorageV1

					return this.verifyValidity(parsedValue) ? parsedValue.value : ''
				}
			}
			catch (e) {
				// Not yet updated, keep going
				this.migrateLocalStorageToVersion1(accessor)
			}
		}
		return value as string
	}

	private setLocalStorage(
		accessor: string, value: string | Record<string, string>, options: Partial<LocalStorageOptions> = {}
	): void {
		const jsonValue = {
			value: value,
			version: LOCAL_STORAGE_VERSION,
			maxAge: options.maxAge,
			createdDate: new Date().toJSON()
		} as LocalStorageV1

		localStorage.setItem(accessor, JSON.stringify(jsonValue))
	}

	private removeLocalStorage(accessor: string): void {
		localStorage.removeItem(accessor)
	}

	private verifyValidity(value: LocalStorageV1): boolean {
		const today = new Date()

		if (!value.createdDate || !value.maxAge) return true

		const createdDate = Date.parse(value.createdDate as unknown as string)
		const diff = (today.valueOf() - createdDate.valueOf()) / 1000 // in seconds
		
		return diff < value.maxAge
	}

	private migrateLocalStorageToVersion1(accessor: string): void {
		const value = localStorage.getItem(accessor)
		const newRes = { version: LOCAL_STORAGE_VERSION, createdDate: new Date().toJSON() } as LocalStorageV1

		if (accessor == SavedStateHandler.WARNING) {
			newRes.maxAge = SavedStateHandler.AGE_WARNING
		}

		if (value) {
			try {
				const storedValue = JSON.parse(value)
				
				// It is JSON, but not in the new version
				if (storedValue.version == undefined) newRes.value = storedValue
			}
			catch (e) {
				// It isn't JSON
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
	maxAge?: number,
	createdDate: string
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