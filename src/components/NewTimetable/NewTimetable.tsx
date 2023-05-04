import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AcademicTerm from '../../domain/AcademicTerm'
import Timetable from '../../domain/Timetable'

import i18next from 'i18next'

import Box from '@material-ui/core/Box'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'

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
} : NewTimetableProps) : JSX.Element {
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
					<Button color="default" onClick={onClose}>
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
