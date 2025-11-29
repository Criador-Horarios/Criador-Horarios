import React, { useState } from 'react'

import { staticData } from '../../utils/api'

import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/Icon'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'

import i18next from 'i18next'
import Typography from '@material-ui/core/Typography'
import OccupancyUpdater, { occupancyRates } from '../../utils/occupancy-updater'
import { useAppState } from '../../hooks/useAppState'
import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import { allTimezones } from '../../utils/timezone'

interface SettingsButtonProps {
	selectedAcademicTerm: string | null;
	onSelectedAcademicTerm: (academicTermId: string) => void;
}

const timezones = allTimezones.map((tz) => { return { value: tz.utc[0], label: tz.text, key: tz.offset}}).sort((a, b) => a.key - b.key)

function SettingsButton ({ selectedAcademicTerm, onSelectedAcademicTerm} : SettingsButtonProps) : JSX.Element {
	const [dialogOpen, setDialogOpen] = useState(false)

	const { timezone, changeTimezone, showAllHours, changeShowAllHours } = useAppState()
	
	const currentOccupancyRate = OccupancyUpdater.getRate()
	const onOccupancyRateUpdate = (newRate: number) => {
		OccupancyUpdater.getInstance().changeRate(newRate)
	}
	
	const handleSelectAcademicTerm = (academicTermId: string) => {
		setDialogOpen(false)
		onSelectedAcademicTerm(academicTermId)
	}

	return (
		<>
			<IconButton color='inherit' onClick={() => setDialogOpen(true)} component="span"
				style={{display: 'initial'}}>
				<Icon>settings</Icon>
			</IconButton>
			<Dialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				fullWidth={true}
			>
				<DialogTitle>
					{i18next.t('settings-dialog.title')}
				</DialogTitle>
				<DialogContent>
					<FormControl variant='outlined' fullWidth={true}>
						<InputLabel>{i18next.t('settings-dialog.select.label') as string}</InputLabel>
						<Select
							id="semester"
							value={selectedAcademicTerm}
							onChange={(e) => handleSelectAcademicTerm(e.target.value as string)}
							label={i18next.t('settings-dialog.select.label') as string}
							// className={styles.semesterSelector}
							autoWidth={true}
						>
							{staticData.terms.map( (s) =>
								<MenuItem key={s.id} value={s.id}>
									{s.term} {s.semester}{i18next.t('settings-dialog.select.value', { count: s.semester }) as string}
								</MenuItem>
							)}
						</Select>
						<Typography variant="caption" gutterBottom style={{marginTop: '8px', fontWeight: 600}}>
							{i18next.t('timetable-dialog.preview-warning') as string}
						</Typography>
					</FormControl>
					<FormControl variant='outlined' fullWidth={true} style={{marginTop: '16px'}}>
						<InputLabel>{i18next.t('settings-dialog.timezone.label') as string}</InputLabel>
						<Select
							value={timezone}
							onChange={(e) => changeTimezone(e.target.value as string)}
							label={i18next.t('settings-dialog.timezone.label') as string}
						>
							{timezones.map((tz) => (
								<MenuItem key={tz.key} value={tz.value}>
									{tz.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl variant='outlined' fullWidth={true} style={{marginTop: '16px'}}>
						<FormControlLabel control={<Checkbox color="primary" disabled={timezone !== 'Europe/Lisbon'} checked={timezone !== 'Europe/Lisbon' || showAllHours} onChange={(e) => changeShowAllHours(e.target.checked)} />} label={i18next.t('settings-dialog.show-all-hours.label') as string} />
					</FormControl>
					<div style={{display: 'none'}}>
						<Typography style={{margin: '10px 0'}}>This is not working, so do not try it :)</Typography>
						<FormControl variant='outlined'
							fullWidth={true}
						>
							<InputLabel>{i18next.t('settings-dialog.occupancy-update.label') as string}</InputLabel>
							<Select
								id="occupancy-update"
								value={currentOccupancyRate}
								// FIXME: Commented so it does not work until fully tested
								onChange={(e) => onOccupancyRateUpdate(e.target.value as number)}
								label={i18next.t('settings-dialog.occupancy-update.label') as string}
								autoWidth={true}
							>
								{Object.entries(occupancyRates).map( (s) =>
									<MenuItem key={s[1]} value={s[1]}>{s[0]}</MenuItem>
								)}
							</Select>
						</FormControl>
						<Typography variant="caption" gutterBottom style={{marginTop: '8px'}}>
							{i18next.t('settings-dialog.occupancy-update.warning') as string}
						</Typography>
					</div>
				</DialogContent>
				<DialogActions>
					<div />
					<Button onClick={() => setDialogOpen(false)} color="primary">
						{i18next.t('settings-dialog.actions.close-button') as string}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}

export default SettingsButton
