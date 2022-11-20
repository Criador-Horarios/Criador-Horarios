import React, { useCallback, useEffect, useRef, useState } from 'react'
import API, { defineCurrentTerm, staticData } from './utils/api'
import './App.scss'

import Course, { CourseColor } from './domain/Course'
import Shift from './domain/Shift'

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
import { useAppState } from './hooks/useAppState'
import { useAlert } from './hooks/useAlert'
import AcademicTerm from './domain/AcademicTerm'

interface AppProps {
	classes: CreateCSSProperties; // TODO use useStyles instead
}

function App ({classes}:AppProps) : JSX.Element {
	const [activeTimetableIndex, setActiveTimetableIndex] = useState(0)
	const [availableTimetables, setAvailableTimetables] = useState<Timetable[]>(() => ([]))

	const [classesDialog, setClassesDialog] = useState(false)
	const [classesByShift, setClassesByShift] = useState<[string, string][]>([])
	const [minimalClasses, setMinimalClasses] = useState<string[]>([])

	const [warningDialog, setWarningDialog] = useState(false) // TODO move warning to separate component
	const [warningTitle, setWarningTitle] = useState('')
	const [warningContent, setWarningContent] = useState('')
	const [warningContinue, setWarningContinue] = useState<() => void>(() => () => {return})

	const [newDomainDialog, setNewDomainDialog] = useState(false)
	const [newDomainURL, setNewDomainURL] = useState(SavedStateHandler.DOMAIN)
	
	const newTimetable = useRef<NewTimetable | null>(null)
	
	const {savedStateHandler, loading, setLoading} = useAppState()
	const dispatchAlert = useAlert()
	
	const activeTimetable = availableTimetables[activeTimetableIndex] || Timetable.emptyTimetable()

	useEffect(() => {
		// Set occupancy updater
		OccupancyUpdater.getInstance().changeRate(occupancyRates['Off'])
		OccupancyUpdater.setUpdateFunction(updateShiftOccupancies);

		(async () => {
			// Fetch all terms
			await defineCurrentTerm()

			// Build state from cookies or url
			const builtTimetable = await buildState()

			// Update current timetable to use the current academic term if does not have
			updateActiveTimetable(builtTimetable.setAcademicTerm(staticData.currentTerm?.id ?? ''))

			setLoading(false)

			// Set warning with all notices
			const isWarned = savedStateHandler.getWarning()
			if (!isWarned) {
				openWarningDialog()
				savedStateHandler.setWarning(true)
			}
		
			// Warn about new domain
			const isWarnedDomain = savedStateHandler.getNewDomain() || (process.env.NODE_ENV && process.env.NODE_ENV === 'development')
			setNewDomainURL(await getSharingURL())
			setNewDomainDialog(!isWarnedDomain)
		})()
	}, [])
	
	useEffect(() => {
		if (availableTimetables.length === 0) {
			// Skip saving, timetables still loading
			return
		}
		savedStateHandler.setSavedTimetables(availableTimetables)
	}, [availableTimetables])
	
	// Immutably update current timetable
	const updateActiveTimetable = useCallback((newTimetable: Timetable) => {
		setAvailableTimetables(timetables => {
			if (Object.is(timetables[activeTimetableIndex], newTimetable)) {
				// Skip updating if it hasn't changed
				return timetables
			}

			const newTimetables = [...timetables]
			newTimetables[activeTimetableIndex] = newTimetable
			return newTimetables
		})
	}, [activeTimetableIndex, setAvailableTimetables])

	const onSelectedDegrees = async (selectedDegrees: string[]): Promise<void> => {
		updateActiveTimetable(activeTimetable.setDegreeAcronyms(selectedDegrees))
	}

	const onSelectedCourse = async (courses: Course[]): Promise<void> => {
		const availableShifts: Shift[] = []
		const newSelectedCourses: Course[] = []

		for (const course of courses) {
			const schedule = await API.getCourseSchedules(course, activeTimetable.getAcademicTerm())

			if (schedule === null) {
				dispatchAlert({ message: i18next.t('alert.cannot-obtain-shifts'), severity:'error' })
				// Remove the course if we can't get the schedules
				return
			}

			availableShifts.push(...schedule)
			newSelectedCourses.push(course)
		}

		updateActiveTimetable(activeTimetable.setCourses(newSelectedCourses).setAvailableShifts(availableShifts))
	}

	const onSelectedTimetable = (timetable: Timetable | string): void => {
		// If a string is received, it is the adding new button, so we want to add a new timetable
		if (typeof timetable === 'string') {
			// let currAcademicTerm = this.state.savedTimetable.
			const currAcademicTerm = staticData.terms
				.find(t => t.id === activeTimetable.getAcademicTerm()) || staticData.currentTerm
			if (currAcademicTerm !== undefined) {
				newTimetable.current?.show(currAcademicTerm, false)
			}
			return
		}

		const newTimetableIndex = availableTimetables.indexOf(timetable)
		setActiveTimetableIndex(Math.max(0, newTimetableIndex))
	}

	const onCreateNewTimetable = (timetable: Timetable): void => {
		setAvailableTimetables(availableTimetables.concat([timetable]))
		setActiveTimetableIndex(availableTimetables.length)
	}

	const onSelectedShift = (shiftName: string, arr: Shift[]): void => {
		const chosenShift = arr.find((s: Shift) => s.getName() === shiftName)

		if (chosenShift) {
			// Add to current timetable
			updateActiveTimetable(activeTimetable.toggleShift(chosenShift))
		}
	}

	const onChangeMultiShiftMode = (event: React.ChangeEvent<HTMLInputElement>, value: boolean): void => {
		updateActiveTimetable(activeTimetable.setMultiShiftMode(value))
	}

	const getSharingURL = async (): Promise<string> => {
		const params = activeTimetable.toURLParams()
		return await SavedStateHandler.getAppURL(params)
	}

	const buildState = async (): Promise<Timetable> => {
		let savedTimetables: Timetable[] = []
		try {
			savedTimetables = await savedStateHandler.getSavedTimetables()
			setAvailableTimetables(savedTimetables)
			setActiveTimetableIndex(0)
			return savedTimetables[0]
		} catch (err) {
			console.error(err)
			return Timetable.emptyTimetable()
		}
	}

	const openWarningDialog = (): void => {
		setWarningTitle(i18next.t('warning.title'))
		setWarningContent((i18next.t('warning.content', {returnObjects: true}) as string[]).join('\n\n'))
		setWarningContinue(() => () => {return})
		setWarningDialog(true)
	}

	const updateShiftOccupancies = async (): Promise<void> => {
		const shiftsById: Record<string, Shift> = {}
		const coursesToBeFetched = new Set<Course>()
		
		// NOTICE: For now we update only the selected shifts
		activeTimetable.getSelectedShifts().forEach((s) => {
			shiftsById[s.getStoredId()] = s
			coursesToBeFetched.add(s.getCourse())
		})

		// TODO check if this is still needed
		await Promise.all(Array.from(coursesToBeFetched).map(async (c) => {
			let newShifts: Shift[] | null | undefined =
				await API.getCourseSchedules(c, activeTimetable.getAcademicTerm())

			newShifts = newShifts?.filter((s) => {
				const toUpdateShift = shiftsById[s.getStoredId()]
				if (toUpdateShift !== undefined) {
					// FIXME: Remove this, just for testing
					// s.occupation.current = Math.round(s.occupation.max * Math.random())
					// --
					toUpdateShift.updateOccupancy(s.getOccupation())
				}

				return toUpdateShift !== undefined
			})

			return newShifts
		}))
	}

	const onChangeAcademicTerm = (academicTerm: AcademicTerm): void => {
		newTimetable.current?.show(academicTerm)
	}

	const deleteTimetable = (timetable: Timetable): void => {
		const timetableIndex = availableTimetables.indexOf(timetable)
		if (timetableIndex < 0) {
			console.error('Failed to delete timetable since it can\'t be found on timetable list', timetable)
			return
		}
		
		const newTimetables = [...availableTimetables]
		newTimetables.splice(timetableIndex, 1)
		setAvailableTimetables(newTimetables)

		if (timetableIndex === activeTimetableIndex) {
			// If active timetable was deleted, select the first available timetable
			setActiveTimetableIndex(0)
		} else if(timetableIndex < activeTimetableIndex) {
			// Ajust index due to element removal from array
			setActiveTimetableIndex(activeTimetableIndex - 1)
		}
	}

	const getCourseColor = (course: Course): CourseColor => {
		return activeTimetable.getCourseColor(course)
	}

	const onChangeCourseColor = (course: Course, color: string): void => {
		updateActiveTimetable(activeTimetable.setCourseColor(course, color))
	}

	return (
		<div className="App">
			<Backdrop className={classes.backdrop as string} open={loading}>
				<CircularProgress color="inherit" />
			</Backdrop>
			<TopBar
				selectedCourses={activeTimetable.getCourses()}
				getCourseColor={getCourseColor}
				onSelectedCourse={onSelectedCourse}
				selectedDegrees={activeTimetable.getDegreeAcronyms()}
				setSelectedDegrees={onSelectedDegrees}
				selectedAcademicTerm={activeTimetable.getAcademicTerm()}
				onChangeAcademicTerm={onChangeAcademicTerm}
			/>
			<div className="main">
				<div className={classes.body as string}>
					<div className="schedules">
						<AvaliableScheduleCard
							availableShifts={activeTimetable.getAvailableShifts()}
							getCourseColor={getCourseColor}
							onSelectedShift={onSelectedShift}
						/>
						<SelectedScheduleCard
							activeTimetable={activeTimetable}
							availableTimetables={availableTimetables}
							onSelectedShift={onSelectedShift}
							onSelectedTimetable={onSelectedTimetable}
							deleteTimetable={deleteTimetable}
							onChangeMultiShiftMode={onChangeMultiShiftMode}
							getCourseColor={getCourseColor}
							onChangeCourseColor={onChangeCourseColor}
						/>
					</div>
				</div>
			</div>
			<Footer />
			<div className="dialogs">
				<Dialog open={classesDialog}>
					<DialogTitle>{i18next.t('classes-dialog.title') as string}</DialogTitle>
					<DialogContent className={classes.contentCopyable as string}>
						<Box>{
							classesByShift.map(c => {
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
						<Typography variant='h6'>{i18next.t('classes-dialog.minimal-classes')}: {minimalClasses.join(', ')}</Typography>
					</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => {setClassesDialog(false)}} color="primary">
							{i18next.t('classes-dialog.actions.close-button') as string}
						</Button>
					</DialogActions>
				</Dialog>
				<Dialog open={warningDialog}>
					<DialogTitle>{warningTitle}</DialogTitle>
					<DialogContent style={{whiteSpace: 'pre-line'}}>{warningContent}</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => {warningContinue(); setWarningDialog(false)}} color="primary">{i18next.t('warning.actions.continue') as string}</Button>
						{/* <Button onClick={() => {this.setState({warningDialog: false})}} color="primary">{i18next.t('warning.actions.back') as string}</Button> */}
					</DialogActions>
				</Dialog>
				<Dialog maxWidth='sm' fullWidth open={newDomainDialog}>
					<DialogTitle style={{alignSelf: 'center'}}>
						{i18next.t('new-domain.title', {domain: SavedStateHandler.DOMAIN?.replaceAll('https://', '')})}
					</DialogTitle>
					<DialogContent style={{display: 'flex', flexDirection: 'column'}}>
						<Box style={{whiteSpace: 'pre-line', alignSelf: 'center'}}>
							{(i18next.t('new-domain.content', {returnObjects: true, domain: SavedStateHandler.DOMAIN?.replaceAll('https://', '')}) as string[]).join('\n\n')}
						</Box>
						<br/>
						<Button variant='contained' style={{alignSelf: 'center'}} href={newDomainURL} color="primary">
							{i18next.t('new-domain.actions.access') as string}
						</Button>
					</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => {setNewDomainDialog(false)}} color="primary">{i18next.t('new-domain.actions.ignore') as string}</Button>
					</DialogActions>
				</Dialog>
				<NewTimetable ref={newTimetable}
					onCreatedTimetable={(newTimetable) => onCreateNewTimetable(newTimetable)}
					onCancel={() => {return}}
				/>
			</div>
		</div>
	)
}

export default withStyles(APP_STYLES)(App)
