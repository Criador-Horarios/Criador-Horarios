import React, { useState } from 'react'

import i18next from 'i18next'
import styles from './Footer.module.scss'

import AppBar from '@material-ui/core/AppBar'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Icon from '@material-ui/core/Icon'
import IconButton from '@material-ui/core/IconButton'
import Link from '@material-ui/core/Link'
import Toolbar from '@material-ui/core/Toolbar'
import Tooltip from '@material-ui/core/Tooltip'

import GitHubIcon from '@material-ui/icons/GitHub'
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

function Footer () : JSX.Element {
	const [openChangelogDialog, setOpenChangelogDialog] = useState(false)
	
	return (
		<footer className="footer">
			<AppBar className={styles.Footer} color="default" position="sticky">
				<Toolbar>
					<Tooltip title={i18next.t('footer.support-button.tooltip') as string}>
						<Link href="https://paypal.me/DanielG5?locale.x=pt_PT" target="_blank" color="inherit">
							<Button
								color='default'
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
							color='default'
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
