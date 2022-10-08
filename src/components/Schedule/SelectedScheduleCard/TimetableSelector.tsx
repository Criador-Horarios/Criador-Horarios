import React, { useState } from 'react'

import i18next from 'i18next'

import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/Icon'
import TextField from '@material-ui/core/TextField'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'

import { Autocomplete, createFilterOptions } from '@material-ui/lab'

import Timetable from '../../../domain/Timetable'
import { useAlert } from '../../../hooks/useAlert'

interface TimetableSelectorProps {
	savedTimetable: Timetable;
	shownTimetables: (Timetable | string)[];
	onSelectedTimetable: (timetable: Timetable | string) => void;
	deleteTimetable: (timetable: Timetable) => void;
}

function TimetableSelector ({savedTimetable, shownTimetables, onSelectedTimetable, deleteTimetable} : TimetableSelectorProps) : JSX.Element {
	const dispatchAlert = useAlert()
	const [timetableToDelete, setTimetableToDelete] = useState<Timetable | null>(null)
	
	const handleDeleteTimetable = () => {
		if (timetableToDelete === null) {
			return
		}
		deleteTimetable(timetableToDelete)
		dispatchAlert({ message: i18next.t('alert.deleted-timetable'), severity: 'success' })
		setTimetableToDelete(null)
	}

	return (
		<>
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
																		onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
																			e.stopPropagation() // prevent changing to this timetable
																			setTimetableToDelete(option)
																		}}
																	>
																		<Icon>delete</Icon>
																	</IconButton>
							}
						</div>
					</Tooltip>
				}
				style={{width: '23%', flexGrow: 1}}
			/>
			<Dialog open={!!timetableToDelete}>
				<DialogTitle>{i18next.t('confirm-delete-timetable-dialog.title')}</DialogTitle>
				<DialogContent style={{whiteSpace: 'pre-line'}}>
					{i18next.t('confirm-delete-timetable-dialog.content', {timetable: timetableToDelete?.name})}
				</DialogContent>
				<DialogActions>
					<Button
						color="primary"
						onClick={() => setTimetableToDelete(null)}
					>
						{i18next.t('confirm-delete-timetable-dialog.actions.cancel')}
					</Button>
					<div />
					<Button
						color="secondary"
						onClick={handleDeleteTimetable}
					>
						{i18next.t('confirm-delete-timetable-dialog.actions.confirm')}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}

export default TimetableSelector