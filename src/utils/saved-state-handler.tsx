import AcademicTerm from '../domain/AcademicTerm'
import Course from '../domain/Course'
import Shift from '../domain/Shift'
import Timetable from '../domain/Timetable'
import API, { defineCurrentTerm, staticData } from './api'
import CourseUpdates from './CourseUpdate'

import i18next from 'i18next'

export default class SavedStateHandler {
	// CONSTANTS
	// Storage keys
	static TERM = 'term'
	static DARK = 'dark'
	static LANGUAGE = 'language'
	static WARNING = 'warning'
	static COLORS = 'colors'
	static SAVED_TIMETABLES = 'saved-timetables'
	static DEBUG = 'debug'

	// URL keys
	static URL_TIMETABLE_NAME = 'n'
	static URL_SHIFTS = 's'
	static URL_DEGREES = 'd'
	static URL_IS_MULTISHIFT = 'm'
	static URL_TERM = 't'
	
	// 
	static DOMAIN = process.env.REACT_APP_URL
	static MAX_AGE_NORMAL = 60*60*24*31*3 // 3 months - UNUSED
	static AGE_WARNING = 60*60*24*2 // 2 days

	static PARAMS_SEP = ';'
	static ARGS_SEP = '~'

	// SINGLETON
	private static instance: SavedStateHandler

	// ATTRIBUTES
	public currentTerm: AcademicTerm | undefined = undefined
	private colors: Record<string, string>
	private savedTimetables: Timetable[] = []
	private urlParams: Record<string, string>
	private debug: boolean

	private constructor(urlParams: Record<string, string>) {
		this.colors = (this.getLocalStorage(SavedStateHandler.COLORS) ?? {}) as Record<string, string>
		this.savedTimetables = this.getCurrentTimetables()
		this.urlParams = urlParams
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
	static changeUrl(): void {
		const title: string = document.title
		const path = API.PATH_PREFIX + '/'

		if (window.history.replaceState) {
			window.history.replaceState({}, title, path)
		} else {
			window.history.pushState({}, title, path)
		}
	}

	static getAppURL(params: string[]): string {
		let domain = SavedStateHandler.DOMAIN
		if (process.env.NODE_ENV === 'development') domain = 'localhost:3000'
		return `${domain}?${params.join('&')}`
	}

	// INSTANCE METHODS
	async getShifts(
		unparsedShifts: string | undefined = undefined,
		degreesChosen: Set<string> = new Set,
		academicTermId: string
	): Promise<[CourseUpdates, ShiftState, string] | undefined> {
		const errors: string[] = []
		const shiftsToParse = unparsedShifts
		if (!shiftsToParse) {
			const courseUpdate = new CourseUpdates()
			courseUpdate.degreeAcronyms = degreesChosen
			return [courseUpdate, { availableShifts: [], selectedShifts: []}, '']
		}

		const shifts = shiftsToParse.split(SavedStateHandler.PARAMS_SEP)
			.map((shift: string) => shift.split(SavedStateHandler.ARGS_SEP))

		const courseUpdate = new CourseUpdates()
		courseUpdate.degreeAcronyms = degreesChosen

		const parsedState = await Promise.all(shifts.map(async (description: string[]) => {
			try {
				return await this.buildCourse(description, courseUpdate, academicTermId)
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
		const newTimetable = new Timetable(i18next.t('timetable-autocomplete.default-timetable'), [], false, false, '')
		newTimetable.save()
		return current.length === 0 ? [newTimetable] : this.savedTimetables
	}
	
	async getSavedTimetables(_forceUpdate = false): Promise<Timetable[]> {
		// If we don't have terms, please fetch them for the timetables
		if (staticData.currentTerm === undefined) {
			await defineCurrentTerm()
		}

		const localTimetables = this.getLocalStorage(SavedStateHandler.SAVED_TIMETABLES)

		let parsedTimetables: (Timetable | undefined)[] = []
		if (!!this.urlParams && Object.keys(urlParams).length !== 0) {
			const parsedTimetable = await Timetable.fromURLParams(this.urlParams)
			parsedTimetables = parsedTimetables.concat(parsedTimetable)
			const usableTimetables = parsedTimetables.filter(t => t !== undefined) as Timetable[]
			this.urlParams = {}
			// TODO: Should we save it?
			if (usableTimetables.length !== 0) this.savedTimetables = usableTimetables
		}

		// Check for schedule from previous version (d, s and t)
		const oldTimetable = await this.migrateOldScheduleToTimetable()
		let needsSaving = false
		if (oldTimetable) needsSaving = true

		// If there are none stored
		// FIXME: Use forceUpdate!
		if (!localTimetables && !needsSaving) {
			return this.getCurrentTimetables()
		}

		// TODO: First time should only fetch the first timetable to avoid getting unused timetables
		const moreParsedTimetables = await Promise.all(Object.values(localTimetables || {}).map(async (unparsedTimetable: string) => {
			return await Timetable.fromString(unparsedTimetable)
		}))

		parsedTimetables = parsedTimetables.concat(moreParsedTimetables)
		parsedTimetables.push(oldTimetable)

		const usableTimetables = parsedTimetables.filter((t) => t !== undefined) as Timetable[]

		this.savedTimetables = usableTimetables

		// Save the preexisting timetable if it is the only one
		if (needsSaving && usableTimetables.length === 1) this.setSavedTimetables(this.savedTimetables)
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
	private async buildCourse(description: string[], updates: CourseUpdates, academicTermId: string): Promise<BuiltCourse> {
		const course = await API.getCourse(description[0], Array.from(updates.degreeAcronyms), academicTermId)

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
		// TODO: If not, store it

		// Set course as selected
		updates.toggleCourse(course, hasColor)

		// Get the course schedules
		const availableShifts = await API.getCourseSchedules(course, academicTermId)
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

	private async migrateOldScheduleToTimetable(): Promise<Timetable | undefined> {
		const dto: Record<string, string> = {}
		const degrees = dto[SavedStateHandler.URL_DEGREES] = this.getLocalStorage('d') as string
		const shifts = dto[SavedStateHandler.URL_SHIFTS] = this.getLocalStorage('s') as string
		const term = dto[SavedStateHandler.URL_TERM] = encodeURI(this.getLocalStorage('term') as string)
		const ismulti = dto[SavedStateHandler.URL_IS_MULTISHIFT] = this.getLocalStorage('ismulti') as string
		dto[SavedStateHandler.URL_TIMETABLE_NAME] = encodeURI(i18next.t('timetable-autocomplete.default-timetable'))

		// If there are no shifts, return none
		if (!shifts) return undefined
		
		const newTimetable = await Timetable.fromURLParams(dto)
		
		// Check degrees
		if (newTimetable &&
				Array.from(newTimetable.degreeAcronyms).filter(d => d.length === 0 || d.includes('\\')).length > 0) {
			return undefined
		}

		// Should remove them, but for now makes them invalid
		this.setLocalStorage('d', degrees, { maxAge: -1 })
		this.setLocalStorage('s', shifts, { maxAge: -1 })
		this.setLocalStorage('term', term, { maxAge: -1 })
		this.setLocalStorage('ismulti', ismulti, { maxAge: -1 })

		return newTimetable
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
