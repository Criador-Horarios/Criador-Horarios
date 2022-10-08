import React from 'react'

import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'

import Brightness2Icon from '@material-ui/icons/Brightness2'
import Brightness5Icon from '@material-ui/icons/Brightness5'

import i18next from 'i18next'
import { useAppState } from '../../hooks/useAppState'

function DarkModeButton () : JSX.Element {
	const {darkMode, changeDarkMode} = useAppState()

	const onChangeDarkMode = () => changeDarkMode(!darkMode)

	return (
		<Tooltip title={i18next.t(darkMode ? 'darkmode-button.dark' : 'darkmode-button.light') as string}>
			<IconButton color="inherit" onClick={onChangeDarkMode} component="span">
				{ darkMode ? <Brightness5Icon/> : <Brightness2Icon/> }
			</IconButton>
		</Tooltip>
	)
}

export default DarkModeButton
