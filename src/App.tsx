import React, { ReactNode } from 'react'
import API, { staticData } from './utils/api'
import './App.scss'

import campiList from './domain/CampiList'
import Course from './domain/Course'
import Shift, { ShiftType } from './domain/Shift'
import Lesson from './domain/Lesson'
import Schedule from './components/Schedule/Schedule'
import ColorPicker from './components/ColorPicker/ColorPicker'
import CourseUpdates, { CourseUpdateType, getCoursesDifference } from './utils/CourseUpdate'
import Degree from './domain/Degree'

import saveToExcel from './utils/excel'
import getCalendar from './utils/calendar-generator'
import { combinations2, it_contains } from './utils/itertools'

import i18next from 'i18next'
import withStyles, { CreateCSSProperties } from '@material-ui/core/styles/withStyles'
import { createTheme, ThemeProvider, Theme } from '@material-ui/core/styles'

import Avatar from '@material-ui/core/Avatar'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import Toolbar from '@material-ui/core/Toolbar'
import Alert from '@material-ui/lab/Alert'
import AppBar from '@material-ui/core/AppBar'
import TopBar from './components/TopBar/TopBar'
import Icon from '@material-ui/core/Icon'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Chip from '@material-ui/core/Chip'
import Paper from '@material-ui/core/Paper'
import Switch from '@material-ui/core/Switch'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import Backdrop from '@material-ui/core/Backdrop'
import CircularProgress from '@material-ui/core/CircularProgress'
import Divider from '@material-ui/core/Divider'
import downloadAsImage from './utils/save-as-image'
import Snackbar from '@material-ui/core/Snackbar'
import Link from '@material-ui/core/Link'
import GitHubIcon from '@material-ui/icons/GitHub'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaypal } from '@fortawesome/free-brands-svg-icons'
import SavedStateHandler from './utils/saved-state-handler'
import CardHeader from '@material-ui/core/CardHeader'

import getClasses, { getMinimalClasses } from './utils/shift-scraper'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Box from '@material-ui/core/Box'
import { APP_STYLES } from './styles/styles'

import AllInclusiveIcon from '@material-ui/icons/AllInclusive'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import { faClone, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import { ListItemIcon, ListItemText, TextField } from '@material-ui/core'
import OccupancyUpdater, { occupancyRates } from './utils/occupancy-updater'
import { Autocomplete, createFilterOptions } from '@material-ui/lab'
import Timetable from './domain/Timetable'
import NewTimetable from './components/NewTimetable/NewTimetable'

class App extends React.Component <{
	classes: CreateCSSProperties
}>{
	state = {
		selectedCourses: new CourseUpdates(),
		shownShifts: [] as Shift[],
		selectedCampi: [...campiList] as string[],
		selectedShiftTypes: Object.values(ShiftType) as string[],
		alertMessage: '',
		alertSeverity: undefined as 'success' | 'info' | 'warning' | 'error' | undefined,
		hasAlert: false as boolean,
		classesDialog: false,
		warningDialog: false,
		changelogDialog: false,
		saveMenuAnchor: null,
		loading: true as boolean,
		lang: i18next.options.lng as string,
		darkMode: false,
		inhibitMultiShiftModeChange: false,
		colorPicker: { show: false as boolean, course: undefined as (undefined | Course)  },
		newDomainDialog: false,
		confirmDeleteTimetable: [false, undefined] as [boolean, undefined | Timetable],
		savedTimetable: new Timetable(i18next.t('timetable-autocomplete.default-timetable'), [], false, false, ''),
		shownTimetables: [] as Timetable[],
		currentAcademicTerm: ''
	}
	savedStateHandler: SavedStateHandler
	selectedDegrees: Degree[] = []
	chosenSchedule: React.RefObject<Schedule>
	topBar: React.RefObject<TopBar>
	colorPicker: React.RefObject<ColorPicker>
	newTimetable: React.RefObject<NewTimetable>
	theme: Theme
	classesByShift: [string, string][] = []
	minimalClasses: string[] = []
	warningTitle = ''
	warningContent = ''
	warningContinue: () => void = () => {return}
	newDomainURL = SavedStateHandler.DOMAIN

	// eslint-disable-next-line
	constructor(props: any) {
		super(props)
		this.onSelectedDegree = this.onSelectedDegree.bind(this)
		this.onSelectedCourse = this.onSelectedCourse.bind(this)
		this.onSelectedShift = this.onSelectedShift.bind(this)
		this.clearSelectedShifts = this.clearSelectedShifts.bind(this)
		this.getLink = this.getLink.bind(this)
		this.changeCampi = this.changeCampi.bind(this)
		this.saveSchedule = this.saveSchedule.bind(this)
		this.handleCloseAlert = this.handleCloseAlert.bind(this)
		this.showAlert = this.showAlert.bind(this)
		this.changeLanguage = this.changeLanguage.bind(this)
		this.onChangeDarkMode = this.onChangeDarkMode.bind(this)
		this.onChangeMultiShiftMode = this.onChangeMultiShiftMode.bind(this)
		this.exportToExcel = this.exportToExcel.bind(this)
		this.updateShiftOccupancies = this.updateShiftOccupancies.bind(this)

		this.chosenSchedule = React.createRef()
		this.topBar = React.createRef()
		this.colorPicker = React.createRef()
		this.newTimetable = React.createRef()

		this.theme = this.getTheme(this.state.darkMode)

		// Set occupancy updater
		OccupancyUpdater.getInstance().changeRate(occupancyRates['Off'])
		OccupancyUpdater.setUpdateFunction(this.updateShiftOccupancies)

		this.savedStateHandler = SavedStateHandler.getInstance(API.getUrlParams())

		API.setLanguage(this.state.lang)
	}

	async componentDidMount() {
		const darkMode = this.savedStateHandler.getDarkMode()
		if (darkMode !== null && darkMode !== this.state.darkMode) {
			this.onChangeDarkMode(darkMode)
		}

		const language = this.savedStateHandler.getLanguage() ?? this.state.lang
		if (language !== this.state.lang) {
			this.changeLanguage(language, async () => { return })
		}

		// Build state from cookies or url
		await this.buildState()

		this.setState({
			loading: false
		})

		// Set warning with all notices
		const isWarned = this.savedStateHandler.getWarning()
		if (!isWarned) {
			this.setWarningDialog()
			this.savedStateHandler.setWarning(true)
		}
		
		// Warn about new domain
		const isWarnedDomain = this.savedStateHandler.getNewDomain() || (process.env.NODE_ENV && process.env.NODE_ENV === 'development')
		this.newDomainURL = await this.getSharingURL()
		this.setState({newDomainDialog: !isWarnedDomain})
	}

	async onSelectedDegree(selectedDegree: Degree[]): Promise<void> {
		this.selectedDegrees = selectedDegree
	}

	async onSelectedCourse(selectedCourses: Course[]): Promise<void> {
		if (selectedCourses.length === 0) {
			// const currCourses = this.state.selectedCourses as CourseUpdates
			const currCourses = this.state.savedTimetable.courseUpdates as CourseUpdates
			currCourses.removeAllCourses()
			// TODO: Change all other selected degrees for the timetable
			this.state.savedTimetable.shiftState.availableShifts = []
			if (this.state.savedTimetable.degreeAcronyms.size === 0) {
				this.setState({
					availableCourses: [],
					selectedCourses: currCourses,
					availableShifts: [],
					shownShifts: []
				})
			} else {
				this.setState({
					selectedCourses: currCourses,
					availableShifts: [],
					shownShifts: []
				})
			}
			this.topBar.current?.setSelectedCourses(currCourses)
			return
		}

		// const changedCourse = getCoursesDifference(this.state.selectedCourses.courses, selectedCourses)
		const changedCourse = getCoursesDifference(this.state.savedTimetable.courseUpdates.courses, selectedCourses)
		if (!changedCourse) {
			return
		}

		// const currCourses = this.state.selectedCourses
		const currCourses = this.state.savedTimetable.courseUpdates
		Object.setPrototypeOf(currCourses, CourseUpdates.prototype) // FIXME: what??
		if (changedCourse.course !== undefined) {
			currCourses.toggleCourse(changedCourse.course)
		} else if (changedCourse.type === CourseUpdateType.Many) {
			selectedCourses.forEach(c => currCourses.toggleCourse(c))
		}

		this.setState({
			selectedCourses: currCourses
		})

		let availableShifts: Shift[] = []
		if (currCourses.lastUpdate?.type === CourseUpdateType.Add &&
			currCourses.lastUpdate.course !== undefined) {
			const schedule =
				await API.getCourseSchedules(currCourses.lastUpdate.course, this.state.savedTimetable.academicTerm)
			if (schedule === null) {
				this.showAlert(i18next.t('alert.cannot-obtain-shifts'), 'error')
				// Remove course if it can't get the schedules
				currCourses.toggleCourse(currCourses.lastUpdate.course)
				this.setState({
					selectedCourses: currCourses
				})
				return
			}
			availableShifts = this.state.savedTimetable.shiftState.availableShifts.concat(schedule)
		} else if (currCourses.lastUpdate?.type === CourseUpdateType.Remove) {
			availableShifts = this.state.savedTimetable.shiftState.availableShifts
				.filter((shift: Shift) => shift.courseId !== currCourses.lastUpdate?.course?.id)
		} else if (currCourses.lastUpdate?.type === CourseUpdateType.Clear) {
			availableShifts = []
		}

		this.state.savedTimetable.shiftState.availableShifts = availableShifts

		const shownShifts = this.filterShifts({
			selectedCampi: this.state.selectedCampi,
			selectedShiftTypes: this.state.selectedShiftTypes,
			availableShifts: availableShifts
		})

		this.topBar.current?.setSelectedCourses(currCourses)
		this.savedStateHandler.setSavedTimetables(this.savedStateHandler.getCurrentTimetables())
		this.setState({ availableShifts, shownShifts })
	}

	onSelectedTimetable(timetable: Timetable | string): void {
		// If a string is received, it is the adding new button, so we want to add a new timetable
		if (typeof timetable === 'string') {
			if (staticData.currentTerm !== undefined) this.newTimetable.current?.show(staticData.currentTerm, false)
			return
		}

		const newTimetable = timetable as Timetable
		// Store timetable if not saved
		if (!newTimetable.isSaved) {
			const prevTimetables = this.savedStateHandler.getCurrentTimetables()
			this.savedStateHandler.setSavedTimetables(prevTimetables.concat([newTimetable]))
		}

		this.updateToNewTimetable(newTimetable)
	}

	getAllLessons(): Lesson[] {
		return this.state.shownShifts.map((shift: Shift) => shift.lessons).flat()
	}

	getSelectedLessons(): Lesson[] {
		return this.state.savedTimetable.shiftState.selectedShifts.map((shift: Shift) => shift.lessons).flat()
	}

	private recomputeDisableMultiShiftModeChange(timetable: Timetable | undefined = undefined) {
		// Check if multi-shift can't be disabled safely
		// if multiple shifts of the same course/type are selected, and
		// multi-shift is disabled, chaos ensues
		const currTimetable = timetable || this.state.savedTimetable
		const disable = currTimetable.isMultiShift && it_contains(
			combinations2(currTimetable.shiftState.selectedShifts),
			([a, b]) => Shift.isSameCourseAndType(a,b)
		)

		if (this.state.inhibitMultiShiftModeChange !== disable) this.setState({ inhibitMultiShiftModeChange: disable })
	}

	onSelectedShift(shiftName: string, arr: Shift[]): void {
		const chosenShift = arr.find((s: Shift) => s.name === shiftName)

		if (chosenShift) {
			// Add to current timetable and save
			this.state.savedTimetable.toggleShift(chosenShift)
			this.savedStateHandler.setSavedTimetables(this.savedStateHandler.getCurrentTimetables())
			this.recomputeDisableMultiShiftModeChange()
			// Store academic term
			const selectedAcademicTerm = this.topBar.current?.state.selectedAcademicTerm
			if (selectedAcademicTerm !== undefined) {
				const parsedTerm = staticData.terms.find((t) => t.id == selectedAcademicTerm)
				if (parsedTerm !== undefined) this.savedStateHandler.setTerm(parsedTerm)
				if (this.state.savedTimetable.academicTerm === '') { 
					this.state.savedTimetable.setAcademicTerm(selectedAcademicTerm)
				}
			}
			this.setState({
				savedTimetable: this.state.savedTimetable,
				shownTimetables: this.savedStateHandler.getCurrentTimetables()
			})
		}
	}

	onChangeMultiShiftMode(event: React.ChangeEvent<HTMLInputElement>, value: boolean): void {
		this.state.savedTimetable.setMultiShiftMode(value)
		this.savedStateHandler.setSavedTimetables(this.savedStateHandler.getCurrentTimetables())
		this.setState({
			shownTimetables: this.savedStateHandler.getCurrentTimetables(), savedTimetable: this.state.savedTimetable
		})
	}

	clearSelectedShifts(alert: boolean): void {
		const successful = this.state.savedTimetable.clearAllShifts()
		if (successful) {
			if (alert) {
				this.showAlert(i18next.t('alert.cleared-schedule'), 'success')
			}

			SavedStateHandler.changeUrl()
		}
	}

	getCoursesBySelectedShifts(): Course[] {
		const finalCourses = [...this.state.savedTimetable.courseUpdates.courses]

		this.state.savedTimetable.shiftState.selectedShifts.forEach( (s) => {
			// FIXME: Includes? hmmmm
			// finalCourses = Comparables.addToSet(finalCourses, s.course) as Record<string, Course>
			if (!finalCourses.find(c => c.id === c.id)) {
				finalCourses.push(s.course)
			}
			// Update course shift types (if selected or not) when the course is added and there was already shifts selected
			s.course.addSelectedShift(s)
		})
		return finalCourses.sort(Course.compare)
	}

	changeCampi(campi: string[]): void {
		const shownShifts = this.filterShifts({
			selectedCampi: campi,
			selectedShiftTypes: this.state.selectedShiftTypes,
			availableShifts: this.state.savedTimetable.shiftState.availableShifts
		})

		this.setState({ selectedCampi: campi, shownShifts })
	}

	changeShiftTypes(types: string[]): void {
		const shownShifts = this.filterShifts({
			selectedCampi: this.state.selectedCampi,
			selectedShiftTypes: types,
			availableShifts: this.state.savedTimetable.shiftState.availableShifts
		})

		this.setState({ selectedShiftTypes: types, shownShifts })
	}

	filterShifts(state: {selectedCampi: string[], selectedShiftTypes: string[], availableShifts: Shift[]}): Shift[] {
		return state.availableShifts.filter( (s) => {
			const campi = state.selectedCampi.includes(s.campus) || s.campus === undefined
			const type = state.selectedShiftTypes.includes(s.type)
			return campi && type
		})
	}

	showAlert(message: string, severity: 'success' | 'warning' | 'info' | 'error' | undefined): void {
		this.setState({
			alertMessage: message,
			alertSeverity: severity,
			hasAlert: true
		})
	}

	handleCloseAlert(): void {
		this.setState({ hasAlert: false })
	}

	async getSharingURL(): Promise<string> {
		const params = this.state.savedTimetable.toURLParams()
		return await SavedStateHandler.getAppURL(params)
	}

	async getLink(): Promise<void> {
		const shortLink = await this.getSharingURL()
		const el = document.createElement('textarea')
		el.value = shortLink
		el.setAttribute('readonly', '')
		el.style.display = 'hidden'
		document.body.appendChild(el)
		el.select()
		document.execCommand('copy')

		document.body.removeChild(el)
		this.showAlert(i18next.t('alert.link-obtained'), 'success')
	}

	async buildState(forceUpdate = false): Promise<void> {
		let savedTimetables: Timetable[] = []
		try {
			savedTimetables = await this.savedStateHandler.getSavedTimetables()
			this.setState({
				shownTimetables: savedTimetables, 
				savedTimetable: savedTimetables[0]
			})
			const degreeAcronyms = savedTimetables[0].getDegreesString()
			if (degreeAcronyms) this.topBar.current?.setSelectedDegrees(degreeAcronyms)
			const currCourses = savedTimetables[0].courseUpdates
			this.topBar.current?.setSelectedCourses(currCourses)
		} catch (err) {
			console.error(err)
		}

		// Update remaining logic (available shifts, campi, shift types)
		if (savedTimetables.length > 0) this.updateToNewTimetable(savedTimetables[0])
	}

	updateToNewTimetable(newTimetable: Timetable): void {
		// FIXME: Should not need try
		try {
			const courseUpdates = newTimetable.courseUpdates
			const errors = newTimetable.errors
			const state = newTimetable.shiftState
			
			if (!courseUpdates || !state) {
				return
			}
			// Show that there were parsing errors
			if (errors !== '') {
				this.showAlert(i18next.t('alert.error-parsing'), 'warning')
			}

			this.topBar.current?.setSelectedCourses(courseUpdates)
			this.setState({
				...state,
				selectedCourses: courseUpdates,
				shownShifts: this.filterShifts({
					selectedCampi: this.state.selectedCampi,
					selectedShiftTypes: this.state.selectedShiftTypes,
					availableShifts: state.availableShifts
				}),
				shownTimetables: this.savedStateHandler.getCurrentTimetables(),
				savedTimetable: newTimetable,
				multiShiftMode: this.state.savedTimetable.isMultiShift
			})
			this.recomputeDisableMultiShiftModeChange(newTimetable)
			SavedStateHandler.changeUrl()
		} catch (err) {
			console.error(err)
			// ignored, bad URL/cookie state
		}
	}

	saveSchedule(): void {
		if (this.state.savedTimetable.shiftState.selectedShifts.length === 0) {
			this.showAlert(i18next.t('alert.no-shift-selected'), 'info')
			return
		}

		downloadAsImage(this.state.savedTimetable.shiftState.selectedShifts, this.state.darkMode)
		this.showAlert(i18next.t('alert.schedule-to-image'), 'success')
	}

	async changeLanguage(language: string, afterChange: () => Promise<void>): Promise<void> {
		if (language !== this.state.lang) {
			this.setState({loading: true, lang: language })
			i18next.changeLanguage(language).then(() => i18next.options.lng = language)
			API.setLanguage(language)

			this.savedStateHandler.setLanguage(language)

			await afterChange()
			this.buildState(true)
			this.setState({ loading: false })
		}
	}

	onChangeDarkMode(dark: boolean): void {
		this.theme = this.getTheme(dark)
		this.setState({
			darkMode: dark
		})
		this.savedStateHandler.setDarkMode(dark)
	}

	getTheme(dark: boolean): Theme {
		return createTheme({
			palette: {
				type: (dark) ? 'dark' : 'light',
				primary: {
					main: (dark) ? '#fff' : '#3f51b5'
				},
				text: {
					primary: (dark) ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)'
				}
			}
		})
	}

	async getClasses(): Promise<void> {
		if (this.state.savedTimetable.degreeAcronyms.size === 0) {
			this.showAlert(i18next.t('alert.minimal-classes-no-degrees'), 'error')
			return
		}

		this.setState({ loading: true })
		
		const [classesByShift, minimalClasses] = await getMinimalClasses(
			this.state.savedTimetable.shiftState.selectedShifts,
			Array.from(this.state.savedTimetable.degreeAcronyms),
			this.state.savedTimetable.academicTerm
		)

		this.classesByShift = Object.entries(classesByShift)
		this.minimalClasses = minimalClasses
		this.setState({classesDialog: true, loading: false})
	}

	setWarningDialog(): void {
		this.warningTitle = i18next.t('warning.title')
		this.warningContent = (i18next.t('warning.content', {returnObjects: true}) as string[]).join('\n\n')
		this.warningContinue = () => {return}
		this.setState({warningDialog: true})
	}

	async exportToExcel(): Promise<void> {
		this.setState({loading: true})
		const classes =
			await getClasses(this.state.savedTimetable.shiftState.selectedShifts, this.state.savedTimetable.academicTerm)

		await saveToExcel(this.state.savedTimetable.shiftState.selectedShifts, classes)

		this.setState({loading: false})
		this.showAlert(i18next.t('alert.schedule-to-excel'), 'success')
	}

	downloadCalendar(): void {
		getCalendar(this.state.savedTimetable.shiftState.selectedShifts)

		this.showAlert(i18next.t('alert.calendar-obtained'), 'success')
	}

	onSaveMenuClick(event: React.MouseEvent<HTMLSpanElement, MouseEvent> | null, open: boolean): void {
		if (open && event !== null) {
			this.setState({
				saveMenuAnchor: event.currentTarget
			})
		} else {
			this.setState({
				saveMenuAnchor: null
			})
		}
	}

	async updateShiftOccupancies(): Promise<void> {
		const shiftsById: Record<string, Shift> = {}
		const coursesToBeFetched = new Set<Course>()
		
		// NOTICE: For now we update only the selected shifts
		this.state.savedTimetable.shiftState.selectedShifts.forEach((s) => {
			shiftsById[s.getStoredId()] = s
			coursesToBeFetched.add(s.course)
		})

		const updatedShifts = await Promise.all(Array.from(coursesToBeFetched).map(async (c) => {
			let newShifts: Shift[] | null | undefined =
				await API.getCourseSchedules(c, this.state.savedTimetable.academicTerm)

			newShifts = newShifts?.filter((s) => {
				const toUpdateShift = shiftsById[s.getStoredId()]
				if (toUpdateShift !== undefined) {
					// FIXME: Remove this, just for testing
					// s.occupation.current = Math.round(s.occupation.max * Math.random())
					// --
					toUpdateShift.updateOccupancy(s.occupation)
				}

				return toUpdateShift !== undefined
			})

			return newShifts
		}))

		// TODO: Maybe this can be moved to the previous cycle
		const newUpdatedShifts = updatedShifts.flat().filter((s) => {
			return s !== undefined
		})

		this.setState({
			selectedShifts: newUpdatedShifts
		})
	}

	render(): ReactNode {
		const classes = this.props.classes

		const StyledToggleButtonGroup = withStyles((theme) => ({
			grouped: {
				margin: theme.spacing(0.5),
				border: 'none',
				'&:not(:first-child)': {
					borderRadius: theme.shape.borderRadius,
				},
				'&:first-child': {
					borderRadius: theme.shape.borderRadius,
				},
			}
		}))(ToggleButtonGroup)

		return (
			<ThemeProvider theme={this.theme}>
				<div className="App">
					<Backdrop className={classes.backdrop as string} open={this.state.loading}>
						<CircularProgress color="inherit" />
					</Backdrop>
					<TopBar
						ref={this.topBar}
						onSelectedCourse={this.onSelectedCourse}
						onSelectedDegree={this.onSelectedDegree}
						onClearShifts={this.clearSelectedShifts}
						showAlert={this.showAlert}
						onChangeLanguage={this.changeLanguage}
						darkMode={this.state.darkMode}
						onChangeDarkMode={this.onChangeDarkMode}
						currentTimetable={this.state.savedTimetable}
						onChangeAcademicTerm={(at) => this.newTimetable.current?.show(at)}
					>
					</TopBar>
					<div className="main">
						<Snackbar
							open={this.state.hasAlert}
							autoHideDuration={3000}
							onClose={this.handleCloseAlert}
							anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
							<Alert
								action={<IconButton size='small' onClick={this.handleCloseAlert}><Icon>close</Icon></IconButton>}
								severity={this.state.alertSeverity}>
								{this.state.alertMessage}
							</Alert>
						</Snackbar>
						<div className={classes.body as string}>
							<div className="schedules">
								<Card className={classes.card as string}>
									<CardHeader title={i18next.t('schedule-available.title') as string}
										titleTypographyProps={{ variant: 'h6', align: 'center' }}
										className={classes.cardTitle as string}
									/>
									<CardContent className={classes.cardContent as string}>
										<Schedule
											onSelectedEvent={(id: string) =>
												this.onSelectedShift(id, this.state.savedTimetable.shiftState.availableShifts)}
											events={this.getAllLessons()} lang={this.state.lang}
											darkMode={this.state.darkMode}
										/>
									</CardContent>
									<CardActions>
										<Paper elevation={0} className={`${classes.paper as string} ${classes.centered as string}`}
											style={{ border: `1px solid ${this.theme.palette.divider}` }}
										>
											<StyledToggleButtonGroup
												className={classes.toggleGroup as string}
												size="small"
												value={this.state.selectedCampi}
												onChange={(_, value) => this.changeCampi(value as string[])}
												aria-label="text alignment"
											>
												{campiList.map((name: string) => (
													<ToggleButton key={name} value={name}>{name}</ToggleButton>
												))}
											</StyledToggleButtonGroup>
											<Divider flexItem orientation="vertical" className={classes.divider as string}/>
											<StyledToggleButtonGroup
												className={classes.toggleGroup as string}
												size="small"
												value={this.state.selectedShiftTypes}
												onChange={(_, value) => this.changeShiftTypes(value as string[])}
											>
												{Object.entries(ShiftType).map((name) => (
													<ToggleButton key={name[1]} value={name[1]}>{name[0]}</ToggleButton>
												))}
											</StyledToggleButtonGroup>
										</Paper>
									</CardActions>
								</Card>
								<Card className={classes.card as string}>
									<CardHeader //title={i18next.t('schedule-selected.title') as string}
										titleTypographyProps={{ variant: 'h6', align: 'center' }}
										className={classes.cardTitle as string}
										title={
											<Box style={{flexDirection: 'row', display: 'flex'}}>
												<span style={{flexGrow: 1, width: '23%'}}></span>
												<Typography variant='h6' align='center' style={{flexGrow: 1}}>{i18next.t('schedule-selected.title')}</Typography>
												<Autocomplete disableClearable autoHighlight size='small'
													filterOptions={(options, params): (Timetable | string)[] => {
														const filter = createFilterOptions<Timetable | string>()
														const filtered = filter(options, params)
														filtered.unshift(i18next.t('timetable-autocomplete.add-new'))
										
														const { inputValue } = params
														// Suggest the creation of a new value
														const isExisting = options.some((option) => typeof option === 'string' || inputValue === option.name)
														if (inputValue !== '' && !isExisting) {
															filtered.push(new Timetable(inputValue, [], false, false, this.state.currentAcademicTerm))
														}
										
														return filtered
													}}
													options={this.state.shownTimetables as (Timetable | string)[]}
													value={this.state.savedTimetable}
													onChange={(_, value) => this.onSelectedTimetable(value)}
													getOptionLabel={(option) => typeof option === 'string' ? i18next.t('timetable-autocomplete.add-new') : option.getDisplayName()}
													renderInput={(params) => <TextField {...params} variant="standard" />}
													renderOption={(option) =>
														<Tooltip title={typeof option === 'string' ? '' : option.academicTerm} placement="bottom">
															<div style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
																{typeof option === 'string' &&
																	<IconButton color="inherit" component="span" size="small" style={{marginLeft: '-8px'}}>
																		<Icon>add</Icon>
																	</IconButton>
																}															
																<Typography style={{flexGrow: 1, overflow: 'clip', marginTop: '4px'}}>
																	{typeof option === 'string' ? i18next.t('timetable-autocomplete.add-new') : option.getDisplayName()}
																</Typography>
																{this.state.shownTimetables.length > 1 && typeof option !== 'string' &&
																	<IconButton color="inherit" component="span" size="small"
																		disabled={this.state.shownTimetables.length <= 1}
																		onClick={() => this.setState({confirmDeleteTimetable: [true, option]})}
																	>
																		<Icon>delete</Icon>
																	</IconButton>
																}
															</div>
														</Tooltip>
													}
													style={{width: '23%', flexGrow: 1}}
												/>
											</Box>
										}
									/>
									<CardContent className={classes.cardContent as string}>
										<Schedule
											onSelectedEvent={(id: string) => this.onSelectedShift(id, this.state.savedTimetable.shiftState.selectedShifts)}
											events={this.getSelectedLessons()} ref={this.chosenSchedule} lang={this.state.lang}
											darkMode={this.state.darkMode}
										/>
									</CardContent>
									<CardActions>
										<div style={{display: 'flex', flexGrow: 1, flexWrap: 'wrap'}}>
											{this.getCoursesBySelectedShifts().map((c) => (
												<Paper elevation={0} variant={'outlined'} key={c.hashString()}
													style={{padding: '4px', margin: '4px', display: 'flex'}}
												>
													<Tooltip title={i18next.t('color-picker-dialog.title', { course: c.acronym}) as string}
														key={c.hashString()}>
														<Chip size="small" color='primary'
															style={{backgroundColor: c.color}}
															label={<span style={{color: c.textColor}}>{c.acronym}</span>}
															onClick={() => this.colorPicker.current?.show(c)} // Toggle colorPicker on click
														/>
													</Tooltip>
													{Array.from(c.getShiftsDisplay()).map((s) => (
														<Paper elevation={0} key={s[0]}
															className={ ( (s[1]) ? classes.checklistSelected : classes.checklistUnselected) as string }
															style={{
																marginLeft: '4px', marginRight: '4px',
																color: `${(s[1]) ? this.theme.palette.text.primary : this.theme.palette.text.hint}`
															}}
														>
															<Typography variant='body1' style={{ fontWeight: 500 }}>{s[0]}</Typography>
														</Paper>
													))}
												</Paper>
											))}
										</div>
										<div className={classes.centered as string}>
											<Tooltip title={i18next.t('multishiftmode-switch') as string}>
												<FormControlLabel
													className={classes.formLabel as string}
													label={<AllInclusiveIcon fontSize="small" />}
													labelPlacement="top"
													control={
														<Switch
															checked={this.state.savedTimetable.isMultiShift}
															disabled={this.state.inhibitMultiShiftModeChange}
															onChange={this.onChangeMultiShiftMode}
															size="small"
														/>
													}
												/>
											</Tooltip>
											<Tooltip title={i18next.t('schedule-selected.actions.get-classes') as string}>
												<IconButton
													disabled={this.state.savedTimetable.shiftState.selectedShifts.length === 0}
													color="inherit"
													onClick={() => this.getClasses()}
													component="span">
													<Icon>list</Icon>
												</IconButton>
											</Tooltip>
											<Tooltip title={i18next.t('link-button.tooltip') as string}>
												<IconButton disabled={this.state.savedTimetable.shiftState.selectedShifts.length === 0} color="inherit" onClick={this.getLink} component="span">
													<Icon>share</Icon>
												</IconButton>
											</Tooltip>
											<Tooltip title={i18next.t('schedule-selected.actions.save-to-file') as string}>
												<IconButton
													disabled={this.state.savedTimetable.shiftState.selectedShifts.length === 0}
													color="inherit"
													onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {this.onSaveMenuClick(e, true)}}
													component="span">
													<Icon>download</Icon>
												</IconButton>
											</Tooltip>
											<Menu anchorEl={this.state.saveMenuAnchor} open={Boolean(this.state.saveMenuAnchor)} keepMounted
												onClose={() => {this.onSaveMenuClick(null, false)}}
												anchorOrigin={{vertical:'top', horizontal:'center'}}
												transformOrigin={{vertical:'bottom', horizontal:'center'}}
											>
												<MenuItem onClick={() => {this.onSaveMenuClick(null, false); this.exportToExcel()}}
													disableRipple>
													<ListItemIcon style={{marginLeft: '4px'}}>
														<FontAwesomeIcon size='lg' icon={faFileExcel}/>
													</ListItemIcon>
													<ListItemText style={{marginLeft: '-4px'}}>{i18next.t('schedule-selected.actions.save-as-excel')}</ListItemText>
												</MenuItem>
												<MenuItem onClick={() => {this.onSaveMenuClick(null, false); this.saveSchedule()}}
													disableRipple>
													<ListItemIcon>
														<Icon>image</Icon>
													</ListItemIcon>
													<ListItemText>{i18next.t('schedule-selected.actions.save-as-image')}</ListItemText>
												</MenuItem>
												<MenuItem onClick={() => {this.onSaveMenuClick(null, false); this.downloadCalendar()}}
													disableRipple>
													<ListItemIcon>
														<Icon>event</Icon>
													</ListItemIcon>
													<ListItemText>{i18next.t('schedule-selected.actions.get-calendar')}</ListItemText>
												</MenuItem>
											</Menu>
											<Tooltip title={i18next.t('schedule-selected.actions.duplicate-timetable') as string}>
												<IconButton
													disabled={this.state.savedTimetable.shiftState.selectedShifts.length === 0}
													color="inherit"
													onClick={() =>
														this.newTimetable.current?.show(staticData.currentTerm || staticData.terms[0], false, this.state.savedTimetable)
													}
													component="span">
													<FontAwesomeIcon icon={faClone}/>
												</IconButton>
											</Tooltip>
										</div>
									</CardActions>
								</Card>
							</div>
						</div>
					</div>
					<div className="footer">
						<AppBar className={classes.footer as string} color="default" position="sticky">
							<Toolbar>
								<Tooltip title={i18next.t('footer.support-button.tooltip') as string}>
									<Link href="https://paypal.me/DanielG5?locale.x=pt_PT" target="_blank" onClick={() => {return}} color="inherit">
										<Button color='default' variant='outlined'
											startIcon={<FontAwesomeIcon icon={faPaypal}/>}
											size='small'
										>{i18next.t('footer.support-button.content') as string}
										</Button>
									</Link>
								</Tooltip>
								<Tooltip title={i18next.t('footer.changelog-button.tooltip') as string} style={{marginLeft: '8px'}}>
									<Button color='default' variant='outlined'
										startIcon={<Icon>new_releases</Icon>}
										size='small'
										onClick={() => {this.setState({changelogDialog: true})}}
									>{i18next.t('footer.changelog-button.content') as string}
									</Button>
								</Tooltip>
								<div className={classes.grow as string} />
								<Tooltip title={i18next.t('footer.repository.tooltip') as string}>
									<Link href="https://github.com/joaocmd/Criador-Horarios" target="_blank" onClick={() => {return}} color="inherit">
										<IconButton color="inherit" onClick={() => {return}} component="span">
											<GitHubIcon></GitHubIcon>
										</IconButton>
									</Link>
								</Tooltip>
								<Tooltip title="João David">
									<Link href="https://github.com/joaocmd" target="_blank" onClick={() => {return}} color="inherit">
										<IconButton size="small" title="João David" onClick={() => {return}}>
											<Avatar alt="Joao David" src={`${process.env.PUBLIC_URL}/img/joao.png`} />
										</IconButton>
									</Link>
								</Tooltip>
								<Tooltip title="Daniel Gonçalves">
									<Link href="https://dang.pt" target="_blank" onClick={() => {return}} color="inherit">
										<IconButton size="small" title="Daniel Gonçalves" onClick={() => {return}}>
											<Avatar alt="Daniel Goncalves" src={`${process.env.PUBLIC_URL}/img/daniel.png`} />
										</IconButton>
									</Link>
								</Tooltip>
							</Toolbar>
						</AppBar>
					</div>
					<div className="dialogs">
						<Dialog open={this.state.classesDialog}>
							<DialogTitle>{i18next.t('classes-dialog.title') as string}</DialogTitle>
							<DialogContent className={classes.contentCopyable as string}>
								<Box>{
									this.classesByShift.map(c => {
										return (
											<div key={c[0]}>
												<Typography key={'course-' + c[0]} variant='h6'>{c[0]}: </Typography>
												<Typography key={'class-' + c[0]} variant='body1'
													style={{marginLeft: '8px'}}
												>{c[1]}</Typography>
											</div>
										)})
								}
								</Box>
								<br/>
								<Typography variant='h6'>{i18next.t('classes-dialog.minimal-classes')}: {this.minimalClasses.join(', ')}</Typography>
							</DialogContent>
							<DialogActions>
								<div />
								<Button onClick={() => {this.setState({classesDialog: false})}} color="primary">
									{i18next.t('classes-dialog.actions.close-button') as string}
								</Button>
							</DialogActions>
						</Dialog>
						<Dialog open={this.state.warningDialog}>
							<DialogTitle>{this.warningTitle}</DialogTitle>
							<DialogContent style={{whiteSpace: 'pre-line'}}>{this.warningContent}</DialogContent>
							<DialogActions>
								<div />
								<Button onClick={() => {this.warningContinue(); this.setState({warningDialog: false})}} color="primary">{i18next.t('warning.actions.continue') as string}</Button>
								{/* <Button onClick={() => {this.setState({warningDialog: false})}} color="primary">{i18next.t('warning.actions.back') as string}</Button> */}
							</DialogActions>
						</Dialog>
						<Dialog maxWidth='sm' fullWidth open={this.state.newDomainDialog}>
							<DialogTitle style={{alignSelf: 'center'}}>
								{i18next.t('new-domain.title', {domain: SavedStateHandler.DOMAIN?.replaceAll('https://', '')})}
							</DialogTitle>
							<DialogContent style={{display: 'flex', flexDirection: 'column'}}>
								<Box style={{whiteSpace: 'pre-line', alignSelf: 'center'}}>
									{(i18next.t('new-domain.content', {returnObjects: true, domain: SavedStateHandler.DOMAIN?.replaceAll('https://', '')}) as string[]).join('\n\n')}
								</Box>
								<br/>
								<Button variant='contained' style={{alignSelf: 'center'}} href={this.newDomainURL} color="primary">
									{i18next.t('new-domain.actions.access') as string}
								</Button>
							</DialogContent>
							<DialogActions>
								<div />
								<Button onClick={() => {this.setState({newDomainDialog: false})}} color="primary">{i18next.t('new-domain.actions.ignore') as string}</Button>
							</DialogActions>
						</Dialog>
						<Dialog open={this.state.changelogDialog}>
							<DialogTitle>{i18next.t('changelog-dialog.title') as string}</DialogTitle>
							<DialogContent style={{whiteSpace: 'pre-line'}}>{(i18next.t('changelog-dialog.content', {returnObjects: true}) as string[]).join('\n\n')}</DialogContent>
							<DialogActions>
								<div />
								<Button onClick={() => {this.setState({changelogDialog: false})}} color="primary">{i18next.t('changelog-dialog.actions.back') as string}</Button>
							</DialogActions>
						</Dialog>
						<Dialog open={this.state.confirmDeleteTimetable[0]}>
							<DialogTitle>{i18next.t('confirm-delete-timetable-dialog.title')}</DialogTitle>
							<DialogContent style={{whiteSpace: 'pre-line'}}>
								{i18next.t('confirm-delete-timetable-dialog.content', {timetable: this.state.confirmDeleteTimetable[1]?.name})}
							</DialogContent>
							<DialogActions>
								<Button onClick={() => this.setState({confirmDeleteTimetable: [false, this.state.confirmDeleteTimetable[1]]})}
									color="primary">
									{i18next.t('confirm-delete-timetable-dialog.actions.cancel')}
								</Button>
								<div />
								<Button color="secondary"
									onClick={() => {
										const prevTimetables = this.savedStateHandler.getCurrentTimetables()
										// Delete the timetable!
										const newTimetables = prevTimetables.filter((t) => t !== this.state.confirmDeleteTimetable[1])
										this.savedStateHandler.setSavedTimetables(newTimetables)
										this.setState({confirmDeleteTimetable: [false, this.state.confirmDeleteTimetable[1]]})
										this.updateToNewTimetable(newTimetables[0])
									}}>
									{i18next.t('confirm-delete-timetable-dialog.actions.confirm')}
								</Button>
							</DialogActions>
						</Dialog>
						<ColorPicker ref={this.colorPicker} onUpdatedColor={(course: Course) => {
							this.state.savedTimetable.shiftState.availableShifts.forEach(shift => {
								if (shift.courseId === course.id) {
									shift.updateColorFromCourse()
									this.savedStateHandler.setCoursesColor([course])
								}
							})
							this.setState({ availableShifts: this.state.savedTimetable.shiftState.availableShifts })
						}}/>
						<NewTimetable ref={this.newTimetable}
							onCreatedTimetable={(newTimetable) => this.onSelectedTimetable(newTimetable)}
							onCancel={() =>
								this.topBar.current?.onSelectedAcademicTerm(this.state.savedTimetable.academicTerm, false)}
						/>
					</div>
				</div>
			</ThemeProvider>
		)
	}
}

export default withStyles(APP_STYLES)(App)
