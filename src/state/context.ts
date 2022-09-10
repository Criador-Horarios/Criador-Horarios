import { Theme } from '@material-ui/core'
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles'
import i18next from 'i18next'
import { createContext } from 'react'
import Degree from '../domain/Degree'
import Shift from '../domain/Shift'
import Timetable from '../domain/Timetable'
import API from '../utils/api'
import CourseUpdates from '../utils/CourseUpdate'
import OccupancyUpdater from '../utils/occupancy-updater'
import SavedStateHandler from '../utils/saved-state-handler'
import getTheme from './theme-selector'

export interface AppContextInterface {
	static: {
		savedStateHandler: SavedStateHandler,
		occupancyUpdater: OccupancyUpdater,
	},
	states: {
		savedTimetable: Timetable,
		selectedDegrees: Degree[],
		selectedCourses: CourseUpdates,
		shownShifts: Shift[],
		currentAcademicTerm: string,
	},
	actions: {
		setSavedTimetable: () => void,
		setSelectedDegrees: () => void,
		setSelectedCourses: () => void,
		setShownShifts: () => void,
		setCurrentAcademicTerm: () => void,
		setDarkMode: (value: boolean) => void,
		setLanguage: (value: string) => void,
	},
	ui: {
		darkMode: boolean,
		lang: string,
		classes: CreateCSSProperties,
		theme: Theme,
	},
}

const emptyContext: AppContextInterface = {
	static: {
		savedStateHandler: SavedStateHandler.getInstance(),
		occupancyUpdater: OccupancyUpdater.getInstance(),
	},
	states: {
		savedTimetable: new Timetable(i18next.t('timetable-autocomplete.default-timetable'), [], false, false, ''),
		selectedDegrees: [],
		selectedCourses: new CourseUpdates(),
		shownShifts: [],
		currentAcademicTerm: '',
	},
	actions: {
		setSavedTimetable: () => { return },
		setSelectedDegrees: () => { return },
		setSelectedCourses: () => { return },
		setShownShifts: () => { return },
		setCurrentAcademicTerm: () => { return },
		setDarkMode: (value: boolean) => { return },
		setLanguage: (value: string) => { return },
	},
	ui: {
		darkMode: false,
		lang: '',
		classes: {},
		theme: getTheme(false)
	},
}

const AppCtx = createContext<AppContextInterface>(emptyContext)

export default AppCtx
