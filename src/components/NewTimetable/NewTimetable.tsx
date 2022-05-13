import React from 'react'
import styles from './NewTimetable.module.scss'
import i18next from 'i18next'

import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Button from '@material-ui/core/Button'
import { Box, TextField } from '@material-ui/core'
import Typography from '@material-ui/core/Typography'
import Timetable from '../../domain/Timetable'
import AcademicTerm from '../../domain/AcademicTerm'
import { staticData } from '../../utils/api'
import SavedStateHandler from '../../utils/saved-state-handler'


class NewTimetable extends React.PureComponent <{
	onCreatedTimetable: (newTimetable: Timetable) => void,
	onCancel: () => void
}, unknown>{
	state = {
		show: false,
		academicTerm: undefined as AcademicTerm | undefined,
		name: '',
		nameError: '',
		showWarning: false,
		oldTimetable: undefined as Timetable | undefined
	}
	previousTimetables = [] as Timetable[]
	
	show(academicTerm: AcademicTerm, showWarning = true, oldTimetable: Timetable | undefined = undefined): void {
		if (oldTimetable !== undefined) {
			academicTerm = staticData.terms.find(t => t.id === oldTimetable.academicTerm) || academicTerm
		}
		this.previousTimetables = SavedStateHandler.getInstance().getCurrentTimetables()
		this.setState({ show: true, academicTerm, name: '', showWarning, oldTimetable })
	}

	confirmCreation(): void {
		// Validate name
		if (!this.validateName(this.state.name)) return

		// Create new timetable with correct academic term
		let newTimetable = new Timetable(this.state.name, [], false, false, this.state.academicTerm?.id || '')
		if (this.state.oldTimetable !== undefined) {
			newTimetable = this.state.oldTimetable.deepCopy()
			newTimetable.name = this.state.name
		}

		this.setState({show: false})
		this.props.onCreatedTimetable(newTimetable)
	}

	// Helpers
	private validateName(name: string): boolean {
		// Cannot be empty
		if (name === '') {
			this.setState({nameError: i18next.t('timetable-dialog.errors.not-empty')})
			return false
		}

		// Verify if there are any other timetables
		if (this.previousTimetables.some(t => t.name === name)) {
			this.setState({nameError: i18next.t('timetable-dialog.errors.already-exists')})
			return false
		}
		
		this.setState({nameError: ''})
		return true
	}

	render(): React.ReactNode {
		return (
			<div>
				<Dialog open={this.state.show} fullWidth={true} maxWidth='xs'>
					<DialogTitle>
						<Typography>{i18next.t('timetable-dialog.title')}</Typography>
					</DialogTitle>
					<DialogContent className={styles.ColorPicker}>
						<Box display="flex" justifyContent="center" flexDirection="column">
							<Typography variant="caption" gutterBottom style={{marginTop: '8px', fontWeight: 600}}>
								{this.state.showWarning && i18next.t('timetable-dialog.warning') as string}
							</Typography>
							<TextField id="timetable-name" label={i18next.t('timetable-dialog.timetable-name')} variant="standard" fullWidth
								value={this.state.name} onChange={(event) => this.setState({name: event.target.value})}
								error={!this.validateName(this.state.name)} helperText={this.state.nameError}
							/>
							{ this.state.oldTimetable !== undefined &&
								<Typography variant="caption">
									{i18next.t('timetable-dialog.copy-of')} “{this.state.oldTimetable.name}”
								</Typography>
							}
							<Typography variant="caption">
								{i18next.t('timetable-dialog.chosen-term')} {this.state.academicTerm?.displayTitle()}
							</Typography>
						</Box>
					</DialogContent>
					<DialogActions>
						<Button color="default" onClick={() => { this.setState({ show: false }); this.props.onCancel() }}>
							{i18next.t('timetable-dialog.actions.cancel')}
						</Button>
						
						<Button color="primary" disabled={!this.validateName(this.state.name)} onClick={() => this.confirmCreation()} >
							{i18next.t('timetable-dialog.actions.save')}
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		)
	}
}

export default NewTimetable
