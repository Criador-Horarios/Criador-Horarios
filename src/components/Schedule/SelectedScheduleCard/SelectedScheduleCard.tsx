import React, { useCallback, useMemo, useState } from 'react'

import i18next from 'i18next'
import styles from '../Schedule.module.scss'

import Box from '@material-ui/core/Box'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Chip from '@material-ui/core/Chip'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/Icon'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Paper from '@material-ui/core/Paper'
import SavedStateHandler from '../../../utils/saved-state-handler'
import Switch from '@material-ui/core/Switch'
import TextField from '@material-ui/core/TextField'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'

import { useTheme } from '@material-ui/core/styles'

import AllInclusiveIcon from '@material-ui/icons/AllInclusive'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClone, faFileExcel } from '@fortawesome/free-solid-svg-icons'
import { Autocomplete, createFilterOptions } from '@material-ui/lab'

import Course from '../../../domain/Course'
import Shift, { ShiftType } from '../../../domain/Shift'
import Timetable from '../../../domain/Timetable'

import Schedule from '../Schedule'
import API from '../../../utils/api'
import getCalendar from '../../../utils/calendar-generator'
import saveToExcel from '../../../utils/excel'
import { combinations2, it_contains } from '../../../utils/itertools'
import downloadAsImage from '../../../utils/save-as-image'
import getClasses, { getMinimalClasses } from '../../../utils/shift-scraper'

interface SelectedScheduleCardProps {
	savedTimetable: Timetable;
	shownTimetables: (Timetable | string)[];
	onSelectedTimetable: (timetable: Timetable | string) => void;
	onSelectedShift: (shiftName: string, arr: Shift[]) => void;
	onChangeMultiShiftMode(event: React.ChangeEvent<HTMLInputElement>, value: boolean): void;
}

function SelectedScheduleCard ({savedTimetable, shownTimetables, onSelectedTimetable, onSelectedShift, onChangeMultiShiftMode} : SelectedScheduleCardProps) : JSX.Element {
	const theme = useTheme()

	const { isMultiShift, degreeAcronyms } = savedTimetable
	const { selectedShifts } = savedTimetable.shiftState
	const academicTerm = savedTimetable.getAcademicTerm()
	
	const [saveMenuAnchor, setSaveMenuAnchor] = useState<EventTarget & HTMLSpanElement | null>(null)
	const openSaveMenu = useCallback((event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
		setSaveMenuAnchor(event.currentTarget)
	}, [])
	const closeSaveMenu = useCallback(() => setSaveMenuAnchor(null), [])

	const selectedLessons = useMemo(() => {
		return selectedShifts.map((shift: Shift) => shift.lessons).flat()
	}, [selectedShifts])
	
	const coursesBySelectedShifts = useMemo(() => {
		const coursesShifts = savedTimetable.getCoursesWithShiftTypes()
		const coursesWithTypes: [Course, Record<ShiftType, boolean | undefined>][] = Object.entries(coursesShifts)
			.map(([courseId, types]) =>
				[API.REQUEST_CACHE.getCourse(courseId, savedTimetable.getAcademicTerm()), types] as [Course, Record<ShiftType, boolean>]
			).filter(([course]) => course !== undefined)

		return coursesWithTypes.sort(([courseA], [courseB]) => Course.compare(courseA, courseB))
	}, [selectedShifts])
	
	const inhibitMultiShiftModeChange = useMemo(() => {
		// Check if multi-shift can't be disabled safely
		// if multiple shifts of the same course/type are selected, and
		// multi-shift is disabled, chaos ensues
		return isMultiShift && it_contains(
			combinations2(selectedShifts),
			([a, b]) => Shift.isSameCourseAndType(a,b)
		)
	}, [isMultiShift, selectedShifts])

	const openClassesDialog = useCallback(async () => {
		if (degreeAcronyms.size === 0) {
			// TODO this.showAlert(i18next.t('alert.minimal-classes-no-degrees'), 'error')
			return
		}

		// TODO this.setState({ loading: true })
		
		const [classesByShift, minimalClasses] = await getMinimalClasses(
			selectedShifts,
			Array.from(degreeAcronyms),
			academicTerm
		)

		// TODO this.setState({classesDialog: true, loading: false})
		// TODO save this somewhere instead of returning
		return {classesByShift: Object.entries(classesByShift), minimalClasses}
	}, [])


	const exportToExcel = useCallback(async () => {
		// TODO this.setState({loading: true})
		const classes =
			await getClasses(selectedShifts, academicTerm)

		await saveToExcel(selectedShifts, classes)

		// TODO this.setState({loading: false})
		// TODO this.showAlert(i18next.t('alert.schedule-to-excel'), 'success')
		closeSaveMenu()
	}, [selectedShifts, academicTerm])

	const downloadCalendar = useCallback(() => {
		getCalendar(selectedShifts)

		// TODO this.showAlert(i18next.t('alert.calendar-obtained'), 'success')
		closeSaveMenu()
	}, [selectedShifts])

	const saveSchedule = useCallback(() => {
		if (selectedShifts.length === 0) {
			// TODO this.showAlert(i18next.t('alert.no-shift-selected'), 'info')
			return
		}

		downloadAsImage(selectedShifts, /*this.state.darkMode*/ true) // FIXME
		//this.showAlert(i18next.t('alert.schedule-to-image'), 'success')
		closeSaveMenu()
	}, [])

	const copyShareLinkToClipboard = useCallback(async () => {
		const params = savedTimetable.toURLParams()
		const url = SavedStateHandler.getAppURL(params)
		
		try {
			navigator.clipboard.writeText(url)
		}catch (e) {
			// fallback to legacy copy to clipboard
			const el = document.createElement('textarea')
			el.value = url
			el.setAttribute('readonly', '')
			el.style.display = 'hidden'
			document.body.appendChild(el)
			el.select()
			document.execCommand('copy')

			document.body.removeChild(el)
		}
		// TODO this.showAlert(i18next.t('alert.link-obtained'), 'success')
	}, [savedTimetable])

	return (
		<Card className={styles.ScheduleCard as string}>
			<CardHeader //title={i18next.t('schedule-selected.title') as string}
				titleTypographyProps={{ variant: 'h6', align: 'center' }}
				className={styles.ScheduleCardTitle as string}
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
									filtered.push(new Timetable(inputValue, [], false, false, ''))
								}

								return filtered
							}}
							options={shownTimetables}
							value={savedTimetable}
							onChange={(_, value) => onSelectedTimetable(value)}
							getOptionLabel={(option) => typeof option === 'string' ? i18next.t('timetable-autocomplete.add-new') : option.getDisplayName()}
							renderInput={(params) => <TextField {...params} variant="standard" />}
							renderOption={(option) =>
								<Tooltip title={typeof option === 'string' ? '' : option.getAcademicTerm()} placement="bottom">
									<div style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
										{typeof option === 'string' &&
																	<IconButton color="inherit" component="span" size="small" style={{marginLeft: '-8px'}}>
																		<Icon>add</Icon>
																	</IconButton>
										}
										<Typography style={{flexGrow: 1, overflow: 'clip', marginTop: '4px'}}>
											{typeof option === 'string' ? i18next.t('timetable-autocomplete.add-new') : option.getDisplayName()}
										</Typography>
										{shownTimetables.length > 1 && typeof option !== 'string' &&
																	<IconButton color="inherit" component="span" size="small"
																		disabled={shownTimetables.length <= 1}
																		// TODO onClick={() => this.setState({confirmDeleteTimetable: [true, option]})}
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
			<CardContent className={styles.ScheduleCardContent as string}>
				<Schedule
					onSelectedEvent={(id: string) => onSelectedShift(id, savedTimetable.shiftState.selectedShifts)}
					events={selectedLessons}
					lang="pt-PT" // FIXME
					darkMode={true} // FIXME
				/>
			</CardContent>
			<CardActions>
				<div style={{display: 'flex', flexGrow: 1, flexWrap: 'wrap'}}>
					{coursesBySelectedShifts.map(([c, types]) => (
						<Paper elevation={0} variant={'outlined'} key={c.hashString()}
							style={{padding: '4px', margin: '4px', display: 'flex'}}
						>
							<Tooltip title={i18next.t('color-picker-dialog.title', { course: c.acronym}) as string}
								key={c.hashString()}>
								<Chip size="small" color='primary'
									style={{backgroundColor: c.color}}
									label={<span style={{color: c.textColor}}>{c.acronym}</span>}
									// TODO onClick={() => this.colorPicker.current?.show(c)} // Toggle colorPicker on click
								/>
							</Tooltip>
							{ Array.from(c.shiftTypes.entries()).map(([type]) => {
								const shown = types[type as ShiftType] !== undefined
								return (
									<Paper elevation={0} key={type}
										className={ (shown ? styles.ShiftChecklistSelected : styles.ShiftChecklistUnselected) as string }
										style={{
											marginLeft: '4px', marginRight: '4px',
											color: `${shown ? theme.palette.text.primary : theme.palette.text.hint}` // TODO use MUI useStyle
										}}
									>
										<Typography variant='body1' style={{ fontWeight: 500 }}>{type}</Typography>
									</Paper>
								)
							})}
						</Paper>
					))}
				</div>
				<div className={styles.ScheduleCentered as string}>
					<Tooltip title={i18next.t('multishiftmode-switch') as string}>
						<FormControlLabel
							className={styles.ScheduleFormLabel as string}
							label={<AllInclusiveIcon fontSize="small" />}
							labelPlacement="top"
							control={
								<Switch
									checked={isMultiShift}
									disabled={inhibitMultiShiftModeChange}
									onChange={onChangeMultiShiftMode}
									size="small"
								/>
							}
						/>
					</Tooltip>
					<Tooltip title={i18next.t('schedule-selected.actions.get-classes') as string}>
						<IconButton
							disabled={savedTimetable.shiftState.selectedShifts.length === 0}
							color="inherit"
							onClick={openClassesDialog}
							component="span">
							<Icon>list</Icon>
						</IconButton>
					</Tooltip>
					<Tooltip title={i18next.t('link-button.tooltip') as string}>
						<IconButton
							disabled={savedTimetable.shiftState.selectedShifts.length === 0}
							color="inherit"
							onClick={copyShareLinkToClipboard}
							component="span"
						>
							<Icon>share</Icon>
						</IconButton>
					</Tooltip>
					<Tooltip title={i18next.t('schedule-selected.actions.save-to-file') as string}>
						<IconButton
							disabled={savedTimetable.shiftState.selectedShifts.length === 0}
							color="inherit"
							onClick={openSaveMenu}
							component="span">
							<Icon>download</Icon>
						</IconButton>
					</Tooltip>
					<Menu anchorEl={saveMenuAnchor} open={!!saveMenuAnchor} keepMounted
						onClose={closeSaveMenu}
						anchorOrigin={{vertical:'top', horizontal:'center'}}
						transformOrigin={{vertical:'bottom', horizontal:'center'}}
					>
						<MenuItem onClick={exportToExcel}
							disableRipple>
							<ListItemIcon style={{marginLeft: '4px'}}>
								<FontAwesomeIcon size='lg' icon={faFileExcel}/>
							</ListItemIcon>
							<ListItemText style={{marginLeft: '-4px'}}>{i18next.t('schedule-selected.actions.save-as-excel')}</ListItemText>
						</MenuItem>
						<MenuItem onClick={saveSchedule}
							disableRipple>
							<ListItemIcon>
								<Icon>image</Icon>
							</ListItemIcon>
							<ListItemText>{i18next.t('schedule-selected.actions.save-as-image')}</ListItemText>
						</MenuItem>
						<MenuItem onClick={downloadCalendar}
							disableRipple>
							<ListItemIcon>
								<Icon>event</Icon>
							</ListItemIcon>
							<ListItemText>{i18next.t('schedule-selected.actions.get-calendar')}</ListItemText>
						</MenuItem>
					</Menu>
					<Tooltip title={i18next.t('schedule-selected.actions.duplicate-timetable') as string}>
						<IconButton
							disabled={savedTimetable.shiftState.selectedShifts.length === 0}
							color="inherit"
							onClick={() => {alert('TODO')}
								// TODO this.newTimetable.current?.show(staticData.currentTerm || staticData.terms[0], false, savedTimetable)
							}
							component="span">
							<FontAwesomeIcon icon={faClone}/>
						</IconButton>
					</Tooltip>
				</div>
			</CardActions>
		</Card>
	)
}

export default SelectedScheduleCard