import { ProviderContext, withSnackbar, SnackbarProvider } from 'notistack';
import React from 'react';

class Notification extends React.Component<ProviderContext>{
  showNotification(message: string, variant: string): void {
    //   this.props.enqueueSnackBar(message, { variant })
    //  fetchSomeData()
    //     .then(() => this.props.enqueueSnackbar('Successfully fetched the data.'))
    //     .catch(() => this.props.enqueueSnackbar('Failed fetching data.'));
  };

//   render(){
//      //...
//   };

};

export default withSnackbar(Notification);

{/* <SnackbarProvider maxSnack={3}>
    <App />
</SnackbarProvider> */}