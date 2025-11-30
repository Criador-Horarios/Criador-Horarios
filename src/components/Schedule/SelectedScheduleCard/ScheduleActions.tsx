import React, { useCallback, useMemo, useState } from 'react'

import i18next from 'i18next'
import styles from '../Schedule.module.scss'

import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Icon from '@mui/material/Icon'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import SavedStateHandler from '../../../utils/saved-state-handler'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'

import AllInclusiveIcon from '@mui/icons-material/AllInclusive'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClone, faFileExcel } from '@fortawesome/free-solid-svg-icons'

import Shift from '../../../domain/Shift'
import Timetable from '../../../domain/Timetable'

import getCalendar from '../../../utils/calendar-generator'
import saveToExcel from '../../../utils/excel'
import { combinations2, it_contains } from '../../../utils/itertools'
import downloadAsImage from '../../../utils/save-as-image'
import { getMinimalClasses } from '../../../utils/shift-scraper'
import { useAlert } from '../../../hooks/useAlert'
import { useAppState } from '../../../hooks/useAppState'
import ClassesDialog from '../../ClassesDialog/ClassesDialog'

interface ScheduleActionsProps {
	activeTimetable: Timetable
	onChangeMultiShiftMode: (event: React.ChangeEvent<HTMLInputElement>, value: boolean) => void
	openDuplicateTimetable: (timetable: Timetable) => void
}

function ScheduleActions ({activeTimetable, onChangeMultiShiftMode, openDuplicateTimetable} : ScheduleActionsProps) : React.ReactElement {
	const dispatchAlert = useAlert()
	const { setLoading, darkMode } = useAppState()
	
	const isMultiShift = activeTimetable.isMultiShiftMode()
	const degreeAcronyms = activeTimetable.getDegreeAcronyms()
	const selectedShifts = activeTimetable.getSelectedShifts()
	const academicTerm = activeTimetable.getAcademicTerm()

	const [saveMenuAnchor, setSaveMenuAnchor] = useState<EventTarget & HTMLSpanElement | null>(null)
	const openSaveMenu = useCallback((event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
		setSaveMenuAnchor(event.currentTarget)
	}, [])
	const closeSaveMenu = useCallback(() => setSaveMenuAnchor(null), [])
	
	const [classesDialog, setClassesDialog] = useState(false)
	const [classesByShift, setClassesByShift] = useState<[string, string][]>([])
	const [minimalClasses, setMinimalClasses] = useState<string[]>([])
	const closeClassesDialog = useCallback(() => setClassesDialog(false), [setClassesDialog])

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
		if (degreeAcronyms.length === 0) {
			dispatchAlert({ message: i18next.t('alert.minimal-classes-no-degrees'), severity: 'error' })
			return
		}

		setLoading(true)
		
		const [classesByShift, minimalClasses] = await getMinimalClasses(selectedShifts, Array.from(degreeAcronyms))

		setLoading(false)
		setClassesDialog(true)
		setClassesByShift(Object.entries(classesByShift))
		setMinimalClasses(minimalClasses)
	}, [degreeAcronyms, selectedShifts, academicTerm])


	const exportToExcel = useCallback(async () => {
		setLoading(true)
		await saveToExcel(selectedShifts, course => activeTimetable.getCourseColor(course))

		setLoading(false)
		dispatchAlert({ message: i18next.t('alert.schedule-to-excel'), severity: 'success' })
		closeSaveMenu()
	}, [selectedShifts, academicTerm, activeTimetable.getAllCoursesColor()])

	const downloadCalendar = useCallback(() => {
		getCalendar(selectedShifts)

		dispatchAlert({ message: i18next.t('alert.calendar-obtained'), severity: 'success' })
		closeSaveMenu()
	}, [selectedShifts])

	const saveSchedule = useCallback(() => {
		if (selectedShifts.length === 0) {
			dispatchAlert({ message: i18next.t('alert.no-shift-selected'), severity: 'info' })
			return
		}

		downloadAsImage(selectedShifts, darkMode, course => activeTimetable.getCourseColor(course))
		dispatchAlert({ message: i18next.t('alert.schedule-to-image'), severity: 'success' })
		closeSaveMenu()
	}, [selectedShifts, darkMode, activeTimetable.getAllCoursesColor()])

	const copyShareLinkToClipboard = useCallback(async () => {
		const params = activeTimetable.toURLParams()
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
		dispatchAlert({ message: i18next.t('alert.link-obtained'), severity: 'success' })
	}, [activeTimetable])
	
	return (
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
					disabled={selectedShifts.length === 0}
					color="inherit"
					onClick={openClassesDialog}
					component="span">
					<Icon>list</Icon>
				</IconButton>
			</Tooltip>
			<Tooltip title={i18next.t('link-button.tooltip') as string}>
				<IconButton
					disabled={selectedShifts.length === 0}
					color="inherit"
					onClick={copyShareLinkToClipboard}
					component="span"
				>
					<Icon>share</Icon>
				</IconButton>
			</Tooltip>
			<Tooltip title={i18next.t('schedule-selected.actions.save-to-file') as string}>
				<IconButton
					disabled={selectedShifts.length === 0}
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
					disabled={selectedShifts.length === 0}
					color="inherit"
					onClick={() => openDuplicateTimetable(activeTimetable)}
					component="span">
					<FontAwesomeIcon icon={faClone}/>
				</IconButton>
			</Tooltip>
			<ClassesDialog
				open={classesDialog}
				classesByShift={classesByShift}
				minimalClasses={minimalClasses}
				onClose={closeClassesDialog}
			/>
		</div>)
}

export default ScheduleActions
