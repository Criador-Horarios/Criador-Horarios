import React from 'react'

import i18next from 'i18next'
import styles from './ClassesDialog.module.scss'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'

interface ClassesDialogProps {
	open: boolean
	classesByShift: [string, string][]
	minimalClasses: string[]
	onClose: () => void
}

function ClassesDialog ({open, classesByShift, minimalClasses, onClose} : ClassesDialogProps) : React.ReactElement {
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
