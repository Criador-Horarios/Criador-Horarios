import React, { ReactNode } from 'react'
import API, { defineCurrentTerm, staticData } from './utils/api'
import './App.scss'

import Course from './domain/Course'
import Shift, { ShiftType } from './domain/Shift'
import CourseUpdates, { CourseUpdateType, getCoursesDifference } from './utils/CourseUpdate'

import i18next from 'i18next'
import withStyles, { CreateCSSProperties } from '@material-ui/core/styles/withStyles'

import Backdrop from '@material-ui/core/Backdrop'
import CircularProgress from '@material-ui/core/CircularProgress'
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
import { AppStateContext } from './hooks/useAppState'
import AcademicTerm from './domain/AcademicTerm'

class App extends React.Component <{
	classes: CreateCSSProperties
}>{
	context!: React.ContextType<typeof AppStateContext>;
	state = {
		selectedDegrees: [] as string[], // degree acronyms
		selectedCourses: new CourseUpdates(),
		classesDialog: false,
		warningDialog: false,
		saveMenuAnchor: null,
		newDomainDialog: false,
		savedTimetable: new Timetable(i18next.t('timetable-autocomplete.default-timetable'), [], false, false, ''),
		shownTimetables: [] as Timetable[],
	}
	newTimetable: React.RefObject<NewTimetable>
	classesByShift: [string, string][] = []
	minimalClasses: string[] = []
	warningTitle = ''
	warningContent = ''
	warningContinue: () => void = () => {return}
	newDomainURL = SavedStateHandler.DOMAIN

	// eslint-disable-next-line
	constructor(props: any) {
		super(props)
		this.onSelectedDegrees = this.onSelectedDegrees.bind(this)
		this.onSelectedCourse = this.onSelectedCourse.bind(this)
		this.onSelectedShift = this.onSelectedShift.bind(this)
		this.onSelectedTimetable = this.onSelectedTimetable.bind(this)
		this.onChangeMultiShiftMode = this.onChangeMultiShiftMode.bind(this)
		this.updateShiftOccupancies = this.updateShiftOccupancies.bind(this)
		this.onChangeAcademicTerm = this.onChangeAcademicTerm.bind(this)
		this.deleteTimetable = this.deleteTimetable.bind(this)
		this.changeCourseColor = this.changeCourseColor.bind(this)

		this.newTimetable = React.createRef()

		// Set occupancy updater
		OccupancyUpdater.getInstance().changeRate(occupancyRates['Off'])
		OccupancyUpdater.setUpdateFunction(this.updateShiftOccupancies)
	}

	async componentDidMount() {
		// Fetch all terms
		await defineCurrentTerm()

		// Update current timetable to use the current academic term if does not have
		this.state.savedTimetable.setAcademicTerm(staticData.currentTerm?.id ?? '')

		// Build state from cookies or url
		await this.buildState()

		this.context.setLoading(false)

		// Set warning with all notices
		const isWarned = this.context.savedStateHandler.getWarning()
		if (!isWarned) {
			this.setWarningDialog()
			this.context.savedStateHandler.setWarning(true)
		}
		
		// Warn about new domain
		const isWarnedDomain = this.context.savedStateHandler.getNewDomain() || (process.env.NODE_ENV && process.env.NODE_ENV === 'development')
		this.newDomainURL = await this.getSharingURL()
		this.setState({newDomainDialog: !isWarnedDomain})
	}

	async onSelectedDegrees(selectedDegrees: string[]): Promise<void> {
		this.setState({
			selectedDegrees
		})
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
				// TODO this.showAlert(i18next.t('alert.cannot-obtain-shifts'), 'error')
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

		this.context.savedStateHandler.setSavedTimetables(this.context.savedStateHandler.getCurrentTimetables())
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
			const prevTimetables = this.context.savedStateHandler.getCurrentTimetables()
			this.context.savedStateHandler.setSavedTimetables(prevTimetables.concat([newTimetable]))
		}

		this.updateToNewTimetable(newTimetable)
	}

	onSelectedShift(shiftName: string, arr: Shift[]): void {
		const chosenShift = arr.find((s: Shift) => s.name === shiftName)

		if (chosenShift) {
			// Add to current timetable and save
			this.state.savedTimetable.toggleShift(chosenShift)
			this.context.savedStateHandler.setSavedTimetables(this.context.savedStateHandler.getCurrentTimetables())
			this.setState({
				savedTimetable: this.state.savedTimetable,
				shownTimetables: this.context.savedStateHandler.getCurrentTimetables()
			})
		}
	}

	onChangeMultiShiftMode(event: React.ChangeEvent<HTMLInputElement>, value: boolean): void {
		this.state.savedTimetable.setMultiShiftMode(value)
		this.context.savedStateHandler.setSavedTimetables(this.context.savedStateHandler.getCurrentTimetables())
		this.setState({
			shownTimetables: this.context.savedStateHandler.getCurrentTimetables(), savedTimetable: this.state.savedTimetable
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

	async getSharingURL(): Promise<string> {
		const params = this.state.savedTimetable.toURLParams()
		return await SavedStateHandler.getAppURL(params)
	}

	// eslint-disable-next-line
	async buildState(_forceUpdate = false): Promise<void> {
		let savedTimetables: Timetable[] = []
		try {
			savedTimetables = await this.context.savedStateHandler.getSavedTimetables()
			this.setState({
				shownTimetables: savedTimetables,
				savedTimetable: savedTimetables[0]
			})
			const degreeAcronyms = savedTimetables[0].getDegreesString()
			if (degreeAcronyms) {
				this.onSelectedDegrees(degreeAcronyms)
			}
			const currCourses = savedTimetables[0].courseUpdates
			this.setState({
				selectedCourses: currCourses
			})
		} catch (err) {
			console.error(err)
		}

		// Update remaining logic (available shifts, campi, shift types)
		if (savedTimetables.length > 0) this.updateToNewTimetable(savedTimetables[0])
	}

	updateToNewTimetable(newTimetable: Timetable): void {
		// FIXME: Should not need try
		try {
			const degrees = newTimetable.getDegreesString() || []
			const courseUpdates = newTimetable.courseUpdates
			const errors = newTimetable.errors
			const state = newTimetable.shiftState
			
			if (!courseUpdates || !state) {
				return
			}
			// Show that there were parsing errors
			if (errors !== '') {
				// TODO this.showAlert(i18next.t('alert.error-parsing'), 'warning')
			}

			this.setState({
				...state,
				selectedDegrees: degrees,
				selectedCourses: courseUpdates,
				shownTimetables: this.context.savedStateHandler.getCurrentTimetables(),
				savedTimetable: newTimetable,
			})
			SavedStateHandler.changeUrl()
		} catch (err) {
			console.error(err)
			// ignored, bad URL/cookie state
		}
	}

	setSelectedAcademicTerm(academicTerm : string): void {
		this.setState({ currentAcademicTerm : academicTerm })
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

	onChangeAcademicTerm(academicTerm: AcademicTerm): void {
		this.newTimetable.current?.show(academicTerm)
	}

	deleteTimetable(timetable: Timetable) : void {
		const prevTimetables = this.context.savedStateHandler.getCurrentTimetables()
		// Delete the timetable!
		const newTimetables = prevTimetables.filter((t) => t !== timetable)
		this.context.savedStateHandler.setSavedTimetables(newTimetables)
		
		if (this.state.savedTimetable === timetable) {
			// Only change to a new timetable if we were on the deleted one
			this.updateToNewTimetable(newTimetables[0])
		} else {
			this.setState({
				shownTimetables: newTimetables
			})
		}
	}

	changeCourseColor(course: Course, color: string) : void {
		course.setColor(color)
		const timetable = this.state.savedTimetable
		timetable.shiftState.availableShifts.forEach(shift => {
			if (shift.courseId === course.id) {
				shift.updateColorFromCourse()
			}
		})
		this.context.savedStateHandler.setCoursesColor([course])
		// Clone shiftState to propagate updates to schedule components
		timetable.shiftState.availableShifts = [...this.state.savedTimetable.shiftState.availableShifts]
		timetable.shiftState.selectedShifts = [...this.state.savedTimetable.shiftState.selectedShifts]
		this.setState({
			savedTimetable: timetable
		})
	}

	render(): ReactNode {
		const classes = this.props.classes

		return (
			<div className="App">
				<Backdrop className={classes.backdrop as string} open={this.context.loading}>
					<CircularProgress color="inherit" />
				</Backdrop>
				<TopBar
					selectedCourses={this.state.savedTimetable.courseUpdates}
					onSelectedCourse={this.onSelectedCourse}
					selectedDegrees={this.state.selectedDegrees}
					setSelectedDegrees={this.onSelectedDegrees}
					selectedAcademicTerm={this.state.savedTimetable.getAcademicTerm()}
					onChangeAcademicTerm={this.onChangeAcademicTerm}
				/>
				<div className="main">
					<div className={classes.body as string}>
						<div className="schedules">
							<AvaliableScheduleCard savedTimetable={this.state.savedTimetable} onSelectedShift={this.onSelectedShift} />
							<SelectedScheduleCard
								savedTimetable={this.state.savedTimetable}
								shownTimetables={this.state.shownTimetables}
								onSelectedShift={this.onSelectedShift}
								onSelectedTimetable={this.onSelectedTimetable}
								deleteTimetable={this.deleteTimetable}
								onChangeMultiShiftMode={this.onChangeMultiShiftMode}
								changeCourseColor={this.changeCourseColor}
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
					<NewTimetable ref={this.newTimetable}
						onCreatedTimetable={(newTimetable) => this.onSelectedTimetable(newTimetable)}
						onCancel={() => this.setState({ selectedAcademicTerm: this.state.savedTimetable.getAcademicTerm() })}
					/>
				</div>
			</div>
		)
	}
}

App.contextType = AppStateContext

export default withStyles(APP_STYLES)(App)
