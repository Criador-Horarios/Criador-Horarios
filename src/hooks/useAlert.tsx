import React, { createContext, useCallback, useContext, useState } from 'react'

import IconButton from '@mui/material/IconButton'
import Icon from '@mui/material/Icon'
import Snackbar from '@mui/material/Snackbar'
import Alert, { AlertColor } from '@mui/material/Alert';

export type AlertSeverity = AlertColor;

export interface AlertDispatchArgs {
  severity: AlertSeverity,
	message: string,
}

export type AlertContextInterface = (args: AlertDispatchArgs) => void;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emptyState : AlertContextInterface = (args) => {return}

export const AlertContext = createContext<AlertContextInterface>(emptyState)

export const useAlert: () => AlertContextInterface = () => useContext(AlertContext)

interface AlertProviderProps {
	children: React.ReactNode;
}


export function AlertProvider ({ children } : AlertProviderProps) : React.ReactElement {
	const [hasAlert, setHasAlert] = useState(false)
	const [severity, setSeverity] = useState<AlertSeverity | undefined>()
	const [message, setMessage] = useState('')
	
	const handleCloseAlert = useCallback(() => setHasAlert(false), [])
	
	const dispatchAlert = useCallback(({severity, message} : AlertDispatchArgs) => {
		setSeverity(severity)
		setMessage(message)
		setHasAlert(true)
	}, [])

	return (
		<AlertContext.Provider
			value={dispatchAlert}
		>
			<Snackbar
				open={hasAlert}
				autoHideDuration={3000}
				onClose={handleCloseAlert}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				<Alert
					action={<IconButton size='small' onClick={handleCloseAlert}><Icon>close</Icon></IconButton>}
					severity={severity}
				>
					{message}
				</Alert>
			</Snackbar>
			{children}
		</AlertContext.Provider>
	)
}
