import React, { ReactNode } from 'react'
import API, { staticData } from './utils/api'
import './App.scss'

import Course from './domain/Course'
import Shift, { ShiftType } from './domain/Shift'
import ColorPicker from './components/ColorPicker/ColorPicker'
import CourseUpdates, { CourseUpdateType, getCoursesDifference } from './utils/CourseUpdate'
import Degree from './domain/Degree'

import i18next from 'i18next'
import withStyles, { CreateCSSProperties } from '@material-ui/core/styles/withStyles'
import { createTheme, ThemeProvider, Theme } from '@material-ui/core/styles'

import IconButton from '@material-ui/core/IconButton'
import Alert from '@material-ui/lab/Alert'
import Icon from '@material-ui/core/Icon'
import Backdrop from '@material-ui/core/Backdrop'
import CircularProgress from '@material-ui/core/CircularProgress'
import Snackbar from '@material-ui/core/Snackbar'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import SavedStateHandler from './utils/saved-state-handler'

import Footer from './components/Footer/Footer'
import AvaliableScheduleCard from './components/Schedule/AvailableScheduleCard/AvaliableScheduleCard'
import SelectedScheduleCard from './components/Schedule/SelectedScheduleCard/SelectedScheduleCard'
import TopBar from './components/TopBar/TopBar'

import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Box from '@material-ui/core/Box'
import { APP_STYLES } from './styles/styles'

import OccupancyUpdater, { occupancyRates } from './utils/occupancy-updater'
import Timetable from './domain/Timetable'
import NewTimetable from './components/NewTimetable/NewTimetable'

class App extends React.Component <{
	classes: CreateCSSProperties
}>{
	state = {
		selectedCourses: new CourseUpdates(),
		alertMessage: '',
		alertSeverity: undefined as 'success' | 'info' | 'warning' | 'error' | undefined,
		hasAlert: false as boolean,
		classesDialog: false,
		warningDialog: false,
		saveMenuAnchor: null,
		loading: true as boolean,
		lang: i18next.options.lng as string,
		darkMode: false,
		colorPicker: { show: false as boolean, course: undefined as (undefined | Course)  },
		newDomainDialog: false,
		confirmDeleteTimetable: [false, undefined] as [boolean, undefined | Timetable],
		savedTimetable: new Timetable(i18next.t('timetable-autocomplete.default-timetable'), [], false, false, ''),
		shownTimetables: [] as Timetable[],
		currentAcademicTerm: ''
	}
	savedStateHandler: SavedStateHandler
	selectedDegrees: Degree[] = []
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
		this.onSelectedTimetable = this.onSelectedTimetable.bind(this)
		this.getLink = this.getLink.bind(this)
		this.handleCloseAlert = this.handleCloseAlert.bind(this)
		this.showAlert = this.showAlert.bind(this)
		this.changeLanguage = this.changeLanguage.bind(this)
		this.onChangeDarkMode = this.onChangeDarkMode.bind(this)
		this.onChangeMultiShiftMode = this.onChangeMultiShiftMode.bind(this)
		this.updateShiftOccupancies = this.updateShiftOccupancies.bind(this)

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
		// this.state.savedTimetable.toggleCourse(selectedCourses) // For future use
		// const courseChange = this.state.savedTimetable.toggleCourse(selectedCourses)

		// // If there was no change for whatever reason, ignore
		// if (!courseChange) return
	
		// // Cleared all courses
		if (selectedCourses.length === 0) { // || courseChange.type === CourseChangeType.Clear) {
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
		//  else {
		// 		this.setState({
		// 			selectedCourses: currCourses,
		// 			availableShifts: [],
		// 			shownShifts: []
		// 		})
		// 	}
		// 	this.topBar.current?.setSelectedCourses(currCourses)
		// 	return
		// }
		// else if (courseChange.type === CourseChangeType.Add && courseChange.courseId) {
		// 	// TODO: Implement
		// }
		// else if (courseChange.type === CourseChangeType.Remove && courseChange.courseId) {
		// 	// TODO: Implement
		// }

		const changedCourse = getCoursesDifference(this.state.savedTimetable.courseUpdates.courses, selectedCourses)
		if (!changedCourse) {
			return
		}

		// this.setState({ selectedCourses })
		// const newCourse = selectedCourses.find(course => course.id === courseChange.courseId)
		// if (newCourse) currCourses.toggleCourse(newCourse)
		// this.topBar.current?.setSelectedCourses(selectedCourses)

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
				await API.getCourseSchedules(currCourses.lastUpdate.course, this.state.savedTimetable.getAcademicTerm())
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

		this.topBar.current?.setSelectedCourses(currCourses)
		this.savedStateHandler.setSavedTimetables(this.savedStateHandler.getCurrentTimetables())
		this.setState({ availableShifts })
	}

	onSelectedTimetable(timetable: Timetable | string): void {
		// If a string is received, it is the adding new button, so we want to add a new timetable
		if (typeof timetable === 'string') {
			// let currAcademicTerm = this.state.savedTimetable.
			const currAcademicTerm = staticData.terms
				.find(t => t.id === this.state.savedTimetable.getAcademicTerm()) || staticData.currentTerm
			if (currAcademicTerm !== undefined) {
				this.newTimetable.current?.show(currAcademicTerm, false)
			}
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

	onSelectedShift(shiftName: string, arr: Shift[]): void {
		const chosenShift = arr.find((s: Shift) => s.name === shiftName)

		if (chosenShift) {
			// Add to current timetable and save
			this.state.savedTimetable.toggleShift(chosenShift)
			this.savedStateHandler.setSavedTimetables(this.savedStateHandler.getCurrentTimetables())
			// Store academic term
			const selectedAcademicTerm = this.topBar.current?.state.selectedAcademicTerm
			if (selectedAcademicTerm !== undefined) {
				const parsedTerm = staticData.terms.find((t) => t.id == selectedAcademicTerm)
				if (parsedTerm !== undefined) this.savedStateHandler.setTerm(parsedTerm)
				if (this.state.savedTimetable.getAcademicTerm() === '') { 
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

	getCoursesBySelectedShifts(): [Course, Record<ShiftType, boolean | undefined>][] {
		const coursesShifts = this.state.savedTimetable.getCoursesWithShiftTypes()
		const coursesWithTypes: [Course, Record<ShiftType, boolean | undefined>][] = Object.entries(coursesShifts)
			.map(([courseId, types]) =>
				[API.REQUEST_CACHE.getCourse(courseId, this.state.savedTimetable.getAcademicTerm()), types] as [Course, Record<ShiftType, boolean>]
			).filter(([course]) => course !== undefined)

		return coursesWithTypes.sort(([courseA], [courseB]) => Course.compare(courseA, courseB))
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

	// eslint-disable-next-line 
	async buildState(_forceUpdate = false): Promise<void> {
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
				shownTimetables: this.savedStateHandler.getCurrentTimetables(),
				savedTimetable: newTimetable,
			})
			SavedStateHandler.changeUrl()
		} catch (err) {
			console.error(err)
			// ignored, bad URL/cookie state
		}
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

	setWarningDialog(): void {
		this.warningTitle = i18next.t('warning.title')
		this.warningContent = (i18next.t('warning.content', {returnObjects: true}) as string[]).join('\n\n')
		this.warningContinue = () => {return}
		this.setState({warningDialog: true})
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
				await API.getCourseSchedules(c, this.state.savedTimetable.getAcademicTerm())

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
						showAlert={this.showAlert}
						onChangeLanguage={this.changeLanguage}
						darkMode={this.state.darkMode}
						onChangeDarkMode={this.onChangeDarkMode}
						currentTimetable={this.state.savedTimetable}
						onChangeAcademicTerm={(at) => this.newTimetable.current?.show(at)}
					/>
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
								<AvaliableScheduleCard savedTimetable={this.state.savedTimetable} onSelectedShift={this.onSelectedShift} />
								<SelectedScheduleCard
									savedTimetable={this.state.savedTimetable}
									shownTimetables={this.state.shownTimetables}
									onSelectedShift={this.onSelectedShift}
									onSelectedTimetable={this.onSelectedTimetable}
									onChangeMultiShiftMode={this.onChangeMultiShiftMode}
								/>
							</div>
						</div>
					</div>
					<Footer />
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
								this.topBar.current?.onSelectedAcademicTerm(this.state.savedTimetable.getAcademicTerm(), false)}
						/>
					</div>
				</div>
			</ThemeProvider>
		)
	}
}

export default withStyles(APP_STYLES)(App)
