import React, { useCallback, useEffect, useState } from 'react'

import i18next from 'i18next'

import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import { useAppState } from '../../hooks/useAppState'

function WarningDialog () : JSX.Element {
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
