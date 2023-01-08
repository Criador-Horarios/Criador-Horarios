import React, { useCallback, useState } from 'react'

import i18next from 'i18next'

import Tooltip from '@material-ui/core/Tooltip'
import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/Icon'
import MenuItem from '@material-ui/core/MenuItem'

import Menu from '@material-ui/core/Menu'
import Avatar from '@material-ui/core/Avatar'
import { useAppState } from '../../hooks/useAppState'

interface LanguageButtonProps {
	refreshAvailableDegrees: () => Promise<void>;
}

function LanguageButton ({ refreshAvailableDegrees } : LanguageButtonProps) : JSX.Element {
	const { changeLanguage } = useAppState()

	const [menuAnchor, setMenuAnchor] = useState<EventTarget & HTMLSpanElement | null>(null)
	const openLanguageMenu = useCallback((event: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
		setMenuAnchor(event.currentTarget)
	}, [])
	const closeLanguageMenu = useCallback(() => setMenuAnchor(null), [])
	
	const onChangeLanguage = (language: string) => () => {
		closeLanguageMenu()
		changeLanguage(language, refreshAvailableDegrees)
	}

	return (
		<>
			<Tooltip title={i18next.t('language-button.tooltip') as string}>
				<IconButton color="inherit"
					onClick={openLanguageMenu}
					component="span"
				>
					<Icon>language</Icon>
				</IconButton>
			</Tooltip>
			<Menu
				id="language-menu"
				anchorEl={menuAnchor}
				keepMounted
				open={!!menuAnchor}
				onClose={closeLanguageMenu}
			>
				<MenuItem onClick={onChangeLanguage('pt')}>
					<Tooltip open={false} title={i18next.t('language.portuguese') as string} placement='left-start'>
						<Avatar alt="Portuguese" src={`${process.env.PUBLIC_URL}/img/language/portugal.png`} />
					</Tooltip>
				</MenuItem>
				<MenuItem onClick={onChangeLanguage('en')}>
					<Tooltip open={false} title={i18next.t('language.english') as string} placement='left-start'>
						<Avatar alt="English" src={`${process.env.PUBLIC_URL}/img/language/united-kingdom.png`} />
					</Tooltip>
				</MenuItem>
			</Menu>
		</>
	)
}

export default LanguageButton
