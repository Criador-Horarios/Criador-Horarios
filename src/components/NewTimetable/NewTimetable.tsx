import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AcademicTerm from '../../domain/AcademicTerm'
import Timetable from '../../domain/Timetable'

import i18next from 'i18next'

import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

interface NewTimetableProps {
	open: boolean
	showChangedAcademicTermWarning: boolean
	academicTerm: AcademicTerm | undefined
	oldTimetable: Timetable | undefined
	existingTimetableNames: string[]
	onClose: () => void
	onCreateTimetable: (timetable: Timetable) => void
}

function NewTimetable ({
	open,
	showChangedAcademicTermWarning,
	academicTerm,
	oldTimetable,
	existingTimetableNames,
	onClose,
	onCreateTimetable,
} : NewTimetableProps) : React.ReactElement {
	const [name, setName] = useState('')

	useEffect(() => {
		if (open) {
			setName('') // clear name on open
		}
	}, [open])

	const {isValidName, nameError} = useMemo(() => {
		// Cannot be empty
		if (name === '') {
			return {isValidName: false, nameError: i18next.t('timetable-dialog.errors.not-empty')}
		}

		// Verify if there are any other timetables
		if (existingTimetableNames.some(t => t === name)) {
			return {isValidName: false, nameError: i18next.t('timetable-dialog.errors.already-exists')}
		}

		return {isValidName: true}
	}, [name, existingTimetableNames])
	
	const confirmCreation = useCallback(() => {
		// Create new timetable with correct academic term
		onClose()
		if (oldTimetable !== undefined) {
			onCreateTimetable(oldTimetable.setName(name))
			return
		}
		const newTimetable = new Timetable(name, [], false, academicTerm?.id || '')
		onCreateTimetable(newTimetable)
	}, [oldTimetable, name, academicTerm])

	return (
		<Dialog open={open} fullWidth={true} maxWidth='xs' onClose={onClose}>
			<form onSubmit={(event) => { event.stopPropagation(); event.preventDefault(); return false}}>
				<DialogTitle>
					<Typography>{i18next.t('timetable-dialog.title')}</Typography>
				</DialogTitle>
				<DialogContent>
					<Box display="flex" justifyContent="center" flexDirection="column">
						<Typography variant="caption" gutterBottom style={{marginTop: '8px', fontWeight: 600}}>
							{showChangedAcademicTermWarning && i18next.t('timetable-dialog.warning') as string}
						</Typography>
						<TextField
							id="timetable-name"
							label={i18next.t('timetable-dialog.timetable-name')}
							variant="standard"
							fullWidth
							value={name}
							onChange={(event) => setName(event.target.value)}
							error={!isValidName}
							helperText={nameError}
							autoFocus
						/>
						{ oldTimetable !== undefined &&
									<Typography variant="caption">
										{i18next.t('timetable-dialog.copy-of')} “{oldTimetable.getName()}”
									</Typography>
						}
						<Typography variant="caption">
							{i18next.t('timetable-dialog.chosen-term')} {academicTerm?.displayTitle()}
						</Typography>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button color="inherit" onClick={onClose}>
						{i18next.t('timetable-dialog.actions.cancel')}
					</Button>

					<Button color="primary" disabled={!isValidName} onClick={confirmCreation} type="submit">
						{i18next.t('timetable-dialog.actions.save')}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	)
}

export default NewTimetable
