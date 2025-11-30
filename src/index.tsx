import React from 'react'
import { createRoot } from 'react-dom/client';
import './index.css'
import App from './App'
// import reportWebVitals from './reportWebVitals'
import API from './utils/api'
import i18n from './i18n/i18n'
import { I18nextProvider } from 'react-i18next'
import { AlertProvider } from './hooks/useAlert'
import { AppStateProvider } from './hooks/useAppState'

API.setMutexes()
API.setPrefix()

const domNode = document.getElementById('root')!;
const root = createRoot(domNode);

root.render(
	<React.StrictMode>
		<I18nextProvider i18n={i18n}>
			<AppStateProvider>
				<AlertProvider>
					<App />
				</AlertProvider>
			</AppStateProvider>
		</I18nextProvider>
	</React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals()
