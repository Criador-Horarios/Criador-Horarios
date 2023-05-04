import React, { useState } from 'react'

import Tooltip from '@material-ui/core/Tooltip'
import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/Icon'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'

import i18next from 'i18next'

function HelpButton () : JSX.Element {
	const [dialogOpen, setDialogOpen] = useState(false)

	return (
		<>
			<Tooltip title={i18next.t('help-button.tooltip') as string}>
				<IconButton disabled={dialogOpen} color="inherit" onClick={() => setDialogOpen(true)} component="span">
					<Icon>help</Icon>
				</IconButton>
			</Tooltip>
			<Dialog open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				maxWidth={'lg'}
				fullWidth={false}
			>
				<DialogContent style={{padding: 0}}>
					<video autoPlay loop style={{width: '100%'}}>
						<source src={`${process.env.PUBLIC_URL}/media/demo.m4v`} type="video/mp4"/>
					</video>
				</DialogContent>
				<DialogActions>
					<div />
					<Button onClick={() => setDialogOpen(false)} color="primary">
						{i18next.t('help-dialog.actions.close-button') as string}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}

export default HelpButton
