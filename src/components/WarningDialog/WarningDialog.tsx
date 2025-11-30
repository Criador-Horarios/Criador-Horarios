import React, { useCallback, useEffect, useState } from 'react'

import i18next from 'i18next'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import { useAppState } from '../../hooks/useAppState'

function WarningDialog () : React.ReactElement {
	const [dialogOpen, setDialogOpen] = useState(false)
	
	const {savedStateHandler} = useAppState()

	useEffect(() => {
		// Set warning with all notices
		const isWarned = savedStateHandler.getWarning()
		if (!isWarned) {
			setDialogOpen(true)
			savedStateHandler.setWarning(true)
		}
	}, [])

	const closeDialog = useCallback(() => {
		setDialogOpen(false)
	}, [setDialogOpen])

	return (
		<Dialog open={dialogOpen}>
			<DialogTitle>{i18next.t('warning.title')}</DialogTitle>
			<DialogContent style={{whiteSpace: 'pre-line'}}>
				{(i18next.t('warning.content', {returnObjects: true}) as string[]).join('\n\n')}
			</DialogContent>
			<DialogActions>
				<div />
				<Button onClick={closeDialog} color="primary">
					{i18next.t('warning.actions.continue') as string}
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default WarningDialog
