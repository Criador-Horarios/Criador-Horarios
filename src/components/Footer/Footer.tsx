import React, { useState } from 'react'

import i18next from 'i18next'
import styles from './Footer.module.scss'

import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import GitHubIcon from '@mui/icons-material/GitHub';
import Icon from '@mui/material/Icon'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaypal } from '@fortawesome/free-brands-svg-icons'

const CREATORS = [
	{
		name: 'João David',
		url: 'https://github.com/joaocmd',
		image: 'joao.png'
	},
	{
		name: 'Daniel Gonçalves',
		url: 'https://dang.pt',
		image: 'daniel.png',
	}
]

function Footer () : React.ReactElement {
	const [openChangelogDialog, setOpenChangelogDialog] = useState(false)
	
	return (
		<footer className="footer">
			<AppBar className={styles.Footer} color="default" position="sticky">
				<Toolbar>
					<Tooltip title={i18next.t('footer.support-button.tooltip') as string}>
						<Link href="https://paypal.me/DanielG5?locale.x=pt_PT" target="_blank" color="inherit">
							<Button
								color='inherit'
								variant='outlined'
								startIcon={<FontAwesomeIcon icon={faPaypal}/>}
								size='small'
							>
								{i18next.t('footer.support-button.content') as string}
							</Button>
						</Link>
					</Tooltip>
					<Tooltip title={i18next.t('footer.changelog-button.tooltip') as string} style={{marginLeft: '8px'}}>
						<Button
							color='inherit'
							variant='outlined'
							startIcon={<Icon>new_releases</Icon>}
							size='small'
							onClick={() => setOpenChangelogDialog(true)}
						>
							{i18next.t('footer.changelog-button.content') as string}
						</Button>
					</Tooltip>
					<div className={styles.grow} />
					<Tooltip title={i18next.t('footer.repository.tooltip') as string}>
						<Link href="https://github.com/joaocmd/Criador-Horarios" target="_blank" color="inherit">
							<IconButton color="inherit" onClick={() => {return}} component="span">
								<GitHubIcon />
							</IconButton>
						</Link>
					</Tooltip>
					{CREATORS.map(creator => (
						<Tooltip key={creator.name} title={creator.name}>
							<Link href={creator.url} target="_blank" color="inherit">
								<IconButton size="small" title={creator.name}>
									<Avatar alt={creator.name} src={`${process.env.PUBLIC_URL}/img/${creator.image}`} />
								</IconButton>
							</Link>
						</Tooltip>
					))}
				</Toolbar>
			</AppBar>
			<Dialog open={openChangelogDialog} onClose={() => setOpenChangelogDialog(false)}>
				<DialogTitle>
					{i18next.t('changelog-dialog.title') as string}
				</DialogTitle>
				<DialogContent style={{whiteSpace: 'pre-line'}}>
					{(i18next.t('changelog-dialog.content', {returnObjects: true}) as string[]).join('\n\n')}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenChangelogDialog(false)} color="primary">
						{i18next.t('changelog-dialog.actions.back') as string}
					</Button>
				</DialogActions>
			</Dialog>
		</footer>
	)
}

export default Footer
