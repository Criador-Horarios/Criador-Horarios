import React, { useState } from 'react'

import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Icon from '@mui/material/Icon'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'

import i18next from 'i18next'

function HelpButton () : React.ReactElement {
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
