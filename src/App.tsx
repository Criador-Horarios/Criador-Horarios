import React, { ReactNode, useContext, useEffect, useState } from 'react'
import API, { staticData } from './utils/api'
import './App.scss'
import Course from './domain/Course'
import Shift, { ShiftType } from './domain/Shift'
import Schedule from './components/Schedule/Schedule'
import ColorPicker from './components/ColorPicker/ColorPicker'
import CourseUpdates, { CourseUpdateType, getCoursesDifference } from './utils/CourseUpdate'
import Degree from './domain/Degree'

import i18next from 'i18next'
import withStyles, { CreateCSSProperties } from '@material-ui/core/styles/withStyles'
import { createTheme, ThemeProvider, Theme } from '@material-ui/core/styles'
import Alert, { Color } from '@material-ui/lab/Alert'
import TopBar from './components/TopBar/TopBar'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import Backdrop from '@material-ui/core/Backdrop'
import CircularProgress from '@material-ui/core/CircularProgress'

import { APP_STYLES } from './styles/styles'
import SavedStateHandler from './utils/saved-state-handler'
import OccupancyUpdater, { occupancyRates } from './utils/occupancy-updater'
import Timetable from './domain/Timetable'
import NewTimetable from './components/NewTimetable/NewTimetable'
import AppCtx, { AppContextInterface } from './state/context'
import getTheme from './state/theme-selector'
import Page from './components/Page/Page'
import Footer from './components/Footer/Footer'

const App = (props: { classes: CreateCSSProperties }) => {
	// References
	const refChosenSchedule = React.createRef<Schedule>()
	const refTopBar = React.createRef<TopBar>()
	const refColorPicker = React.createRef<ColorPicker>()
	const refNewTimetable = React.createRef<NewTimetable>()

	// States
	const [darkMode, setDarkMode] = useState(false)
	const [language, setLanguage] = useState(i18next.options.lng as string)
	const [loading, setLoading] = useState(true)
	const [newDomainDialog, setNewDomainDialog] = useState(false)
	const [alert, setAlert] = useState<{
		enabled: boolean, severity?: Color | undefined, message?: string
	}>({ enabled: false })

	// States for page component
	const selectedCampi = ''
	const selectedShiftTypes: string[] = []
	const shownTimetables: string[] = []

	// Actions
	// TODO: Implement
	const handleCloseAlert = () => setAlert({ enabled: false })
	const onSelectedDegree = async (selectedDegree: Degree[]) => { return }
	const onSelectedCourse = async (selectedCourses: Course[]) => { return }
	const onSelectedShift = (shiftName: string, arr: Shift[]) => { return }
	const showAlert = (message: string, severity: Color | undefined) =>
		setAlert({ message: message, severity: severity, enabled: true })
	const changeLanguage = async (language: string, afterChange: () => Promise<void>) => { return }
	const onChangeDarkMode = (dark: boolean) => { return }
	const changeCampi = (campi: string[]) => { return }
	const onSelectedTimetable = (timetable: Timetable | string) => { return }
	const changeShiftTypes = (types: string[]) => { return }

	// Helpers
	const getAllLessons = () => { return [] }
	const getSelectedLessons = () => { return [] }
	const savedStateHandler = SavedStateHandler.getInstance(API.getUrlParams())

	// Global
	const theme = getTheme(darkMode)
	API.setLanguage(language) // TODO: Update API as well!
	const classes = props.classes

	// ComponentDidMount
	useEffect(() => {
		const newDarkMode = savedStateHandler.getDarkMode()
		if (newDarkMode !== null && darkMode !== newDarkMode) {
			// onChangeDarkMode(darkMode)
		}

		const newLanguage = savedStateHandler.getLanguage() ?? language
		if (language !== newLanguage) {
			// changeLanguage(language, async () => { return })
		}

		// Build state from cookies or url
		// await buildState()

		setLoading(false)

		// Set warning with all notices
		const isWarned = savedStateHandler.getWarning()
		if (!isWarned) {
			// setWarningDialog()
			savedStateHandler.setWarning(true)
		}
		
		// Warn about new domain
		const isWarnedDomain = savedStateHandler.getNewDomain() ||
			(process.env.NODE_ENV && process.env.NODE_ENV === 'development')
		// const newDomainURL = getSharingURL()


		setNewDomainDialog(!isWarnedDomain)
	})

	// Render
	const appContext: AppContextInterface = {
		static: {
			savedStateHandler,
			occupancyUpdater: OccupancyUpdater.getInstance(),
		},
		states: {
			savedTimetable: new Timetable(i18next.t('timetable-autocomplete.default-timetable'), [], false, false, ''),
			selectedCourses: new CourseUpdates(),
			selectedDegrees: [],
			shownShifts: [],
			currentAcademicTerm: '',
		},
		actions: {
			setSavedTimetable: () => { return },
			setSelectedDegrees: () => { return },
			setSelectedCourses: () => { return },
			setShownShifts: () => { return },
			setCurrentAcademicTerm: () => { return },
			setDarkMode: (value) => setDarkMode(value),
			setLanguage: (value) => setLanguage(value),
		},
		ui: {
			lang: i18next.options.lng as string,
			darkMode: true,
			classes,
			theme
		}
	}

	return (
		<ThemeProvider theme={theme}>
			<AppCtx.Provider value={appContext}>
				<Backdrop className={classes.backdrop as string} open={loading}>
					<CircularProgress color="inherit" />
				</Backdrop>
				<div className="App">
					<TopBar
						ref={refTopBar}
						onSelectedCourse={onSelectedCourse}
						onSelectedDegree={onSelectedDegree}
						showAlert={showAlert}
						onChangeLanguage={changeLanguage}
						darkMode={appContext.ui.darkMode}
						onChangeDarkMode={onChangeDarkMode}
						currentTimetable={appContext.states.savedTimetable}
						onChangeAcademicTerm={(at) => refNewTimetable.current?.show(at)}
					>
					</TopBar>
					<Page></Page>
				</div>
				<Footer></Footer>
			</AppCtx.Provider>
		</ThemeProvider>
	)
}

export default withStyles(APP_STYLES)(App)
// export default App
