import React, { useCallback, useEffect, useMemo, useState } from 'react'
import API, { defineCurrentTerm, staticData } from './utils/api'
import './App.scss'

import Course, { CourseColor } from './domain/Course'
import Shift from './domain/Shift'

import i18next from 'i18next'

import Backdrop from '@material-ui/core/Backdrop'
import CircularProgress from '@material-ui/core/CircularProgress'
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
import WarningDialog from './components/WarningDialog/WarningDialog'
import useNewTimetable from './hooks/useNewTimetable'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(APP_STYLES)

function App () : JSX.Element {
	const classes = useStyles()
	const [activeTimetableIndex, setActiveTimetableIndex] = useState(0)
	const [availableTimetables, setAvailableTimetables] = useState<Timetable[]>(() => ([]))

	const [newDomainDialog, setNewDomainDialog] = useState(false)
	const [newDomainURL, setNewDomainURL] = useState(SavedStateHandler.DOMAIN)
	
	const {savedStateHandler, loading, setLoading} = useAppState()
	const dispatchAlert = useAlert()
	
	const activeTimetable = availableTimetables[activeTimetableIndex] || Timetable.emptyTimetable()

	useEffect(() => {
		// Set occupancy updater
		OccupancyUpdater.getInstance().changeRate(occupancyRates['Off']);

		(async () => {
			// Fetch all terms
			await defineCurrentTerm()

			// Build state from cookies or url
			const builtTimetable = await buildState()

			// Update current timetable to use the current academic term if does not have
			updateActiveTimetable(builtTimetable.setAcademicTerm(staticData.currentTerm?.id ?? ''))

			setLoading(false)

		
			// New domain expired 2 years ago, no warning needed!
			// Warn about new domain
			// const isWarnedDomain = savedStateHandler.getNewDomain() || (process.env.NODE_ENV && process.env.NODE_ENV === 'development')
			// setNewDomainURL(await getSharingURL())
			// setNewDomainDialog(!isWarnedDomain)
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
	
	const onCreateNewTimetable = useCallback((timetable: Timetable): void => {
		setAvailableTimetables(availableTimetables => availableTimetables.concat([timetable]))
		setActiveTimetableIndex(availableTimetables.length)
	}, [setAvailableTimetables, setActiveTimetableIndex, availableTimetables.length])

	const {
		openNewTimetable,
		openDuplicateTimetable,
		openAfterChangeAcademicTerm,
		newTimetableProps,
	} = useNewTimetable()


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
				openNewTimetable(currAcademicTerm)
			}
			return
		}

		const newTimetableIndex = availableTimetables.indexOf(timetable)
		setActiveTimetableIndex(Math.max(0, newTimetableIndex))
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

	const updateShiftOccupancies = useCallback(async (): Promise<void> => {
		const coursesToBeFetched = new Set<Course>()

		// NOTICE: For now we update only the selected shifts
		activeTimetable.getSelectedShifts().forEach((s) => {
			coursesToBeFetched.add(s.getCourse())
		})

		const newShifts: Shift[] = (await Promise.all(Array.from(coursesToBeFetched).map(async (c) => {
			const newShifts: Shift[] | null | undefined =
				await API.getCourseSchedules(c, activeTimetable.getAcademicTerm(), true)

			return newShifts || []
		}))).flat()

		if (newShifts.length > 0) {
			updateActiveTimetable(activeTimetable.updateOccupancies(newShifts))
		}
	}, [activeTimetable])

	useEffect(() => {
		OccupancyUpdater.setUpdateFunction(updateShiftOccupancies)
	}, [updateShiftOccupancies])

	const onChangeAcademicTerm = (academicTerm: AcademicTerm): void => {
		openAfterChangeAcademicTerm(academicTerm)
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

	const getCourseColor = useCallback((course: Course): CourseColor => {
		return activeTimetable.getCourseColor(course)
	}, [activeTimetable.getAllCoursesColor()])

	const onChangeCourseColor = (course: Course, color: string): void => {
		updateActiveTimetable(activeTimetable.setCourseColor(course, color))
	}

	const existingTimetableNames = useMemo(() => {
		return availableTimetables.map(timetable => timetable.getName())
	}, [availableTimetables])

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
							openDuplicateTimetable={openDuplicateTimetable}
						/>
					</div>
				</div>
			</div>
			<Footer />
			<div className="dialogs">
				<WarningDialog />
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
				<NewTimetable
					open={newTimetableProps.open}
					onClose={newTimetableProps.onClose}
					showChangedAcademicTermWarning={newTimetableProps.showChangedAcademicTermWarning}
					academicTerm={newTimetableProps.academicTerm}
					oldTimetable={newTimetableProps.oldTimetable}
					onCreateTimetable={onCreateNewTimetable}
					existingTimetableNames={existingTimetableNames}
				/>
			</div>
		</div>
	)
}

export default App
