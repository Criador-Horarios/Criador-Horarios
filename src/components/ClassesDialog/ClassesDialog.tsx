import React from 'react'

import i18next from 'i18next'
import styles from './ClassesDialog.module.scss'

import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Typography from '@material-ui/core/Typography'

interface ClassesDialogProps {
	open: boolean
	classesByShift: [string, string][]
	minimalClasses: string[]
	onClose: () => void
}

function ClassesDialog ({open, classesByShift, minimalClasses, onClose} : ClassesDialogProps) : JSX.Element {
	return (
		<Dialog open={open}>
			<DialogTitle>{i18next.t('classes-dialog.title') as string}</DialogTitle>
			<DialogContent className={styles.contentCopyable}>
				<Box>{
					classesByShift.map(c => {
						return (
							<div key={c[0]}>
								<Typography key={'course-' + c[0]} variant='h6'>{c[0]}: </Typography>
								<Typography
									key={'class-' + c[0]}
									variant='body1'
									style={{marginLeft: '8px'}}
								>
									{c[1]}
								</Typography>
							</div>
						)})
				}
				</Box>
				<br/>
				<Typography variant='h6'>{i18next.t('classes-dialog.minimal-classes')}: {minimalClasses.join(', ')}</Typography>
			</DialogContent>
			<DialogActions>
				<div />
				<Button onClick={onClose} color="primary">
					{i18next.t('classes-dialog.actions.close-button') as string}
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default ClassesDialog
