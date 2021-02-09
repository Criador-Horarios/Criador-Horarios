import { ProviderContext, useSnackbar, withSnackbar, } from 'notistack'
import React from 'react'

class Notification extends React.Component<ProviderContext> {
	static showNotification(message: string, variant: string): void {
		// this.props.enqueueSnackbar(message, { variant: "info" })
		const { enqueueSnackbar, closeSnackbar } = useSnackbar()
	//  fetchSomeData()
	//     .then(() => this.props.enqueueSnackbar('Successfully fetched the data.'))
	//     .catch(() => this.props.enqueueSnackbar('Failed fetching data.'));
	}

	//   render(){
	//      //...
	//   }
}

export default withSnackbar(Notification)