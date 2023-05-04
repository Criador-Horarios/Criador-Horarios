import React, { createContext, useCallback, useContext, useState } from 'react'

import Alert, { Color } from '@material-ui/lab/Alert'
import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/Icon'
import Snackbar from '@material-ui/core/Snackbar'

export type AlertSeverity = Color;

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


export function AlertProvider ({ children } : AlertProviderProps) : JSX.Element {
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
