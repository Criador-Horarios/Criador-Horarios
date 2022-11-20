import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import API from './utils/api'
import i18n from './i18n/i18n'
import { I18nextProvider } from 'react-i18next'
import { StylesProvider } from '@material-ui/core'
import { AlertProvider } from './hooks/useAlert'
import { AppStateProvider } from './hooks/useAppState'
import { CourseColorsProvider } from './hooks/useCourseColors'

API.setMutexes()
API.setPrefix()

ReactDOM.render(
	<React.StrictMode>
		<I18nextProvider i18n={i18n}>
			<StylesProvider injectFirst>
				<AppStateProvider>
					<CourseColorsProvider>
						<AlertProvider>
							<App />
						</AlertProvider>
					</CourseColorsProvider>
				</AppStateProvider>
			</StylesProvider>
		</I18nextProvider>
	</React.StrictMode>,
	document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
