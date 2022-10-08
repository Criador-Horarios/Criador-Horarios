import React, { useCallback, useMemo, useState } from 'react'

import i18next from 'i18next'
import styles from '../Schedule.module.scss'

import FormControlLabel from '@material-ui/core/FormControlLabel'
import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/Icon'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import SavedStateHandler from '../../../utils/saved-state-handler'
import Switch from '@material-ui/core/Switch'
import Tooltip from '@material-ui/core/Tooltip'

import AllInclusiveIcon from '@material-ui/icons/AllInclusive'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClone, faFileExcel } from '@fortawesome/free-solid-svg-icons'

import Shift from '../../../domain/Shift'
import Timetable from '../../../domain/Timetable'

import getCalendar from '../../../utils/calendar-generator'
import saveToExcel from '../../../utils/excel'
import { combinations2, it_contains } from '../../../utils/itertools'
import downloadAsImage from '../../../utils/save-as-image'
import getClasses, { getMinimalClasses } from '../../../utils/shift-scraper'

interface ScheduleActionsProps {
	savedTimetable: Timetable;
	onChangeMultiShiftMode(event: React.ChangeEvent<HTMLInputElement>, value: boolean): void;
}

function ScheduleActions ({savedTimetable, onChangeMultiShiftMode} : ScheduleActionsProps) : JSX.Element {
	const { isMultiShift, degreeAcronyms } = savedTimetable
	const { selectedShifts } = savedTimetable.shiftState
	const academicTerm = savedTimetable.getAcademicTerm()

	const [saveMenuAnchor, setSaveMenuAnchor] = useState<EventTarget & HTMLSpanElement | null>(null)
	const openSaveMenu = useCallback((event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
		setSaveMenuAnchor(event.currentTarget)
	}, [])
	const closeSaveMenu = useCallback(() => setSaveMenuAnchor(null), [])

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
		</div>)
}

export default ScheduleActions