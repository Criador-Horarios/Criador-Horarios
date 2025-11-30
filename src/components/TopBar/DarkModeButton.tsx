import React from 'react'

import IconButton from '@mui/material/IconButton'
import Brightness5Icon from '@mui/icons-material/Brightness5';
import Brightness2Icon from '@mui/icons-material/Brightness2';
import Tooltip from '@mui/material/Tooltip'

import i18next from 'i18next'
import { useAppState } from '../../hooks/useAppState'

function DarkModeButton () : React.ReactElement {
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
