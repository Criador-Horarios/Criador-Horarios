import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import i18next from 'i18next'

import SavedStateHandler from '../utils/saved-state-handler'
import API from '../utils/api'
import { createTheme, Theme, ThemeProvider } from '@material-ui/core/styles'

export interface AppStateContextInterface {
	savedStateHandler: SavedStateHandler;
	loading: boolean;
	setLoading: (loading: boolean) => void;
	darkMode: boolean;
	changeDarkMode: (dark: boolean) => void;
	lang: string;
	changeLanguage: (language: string, afterChange: () => Promise<void>) => Promise<void>;
}

const emptyState : AppStateContextInterface = {
	savedStateHandler: null as unknown as SavedStateHandler, // If we create an instance here, caos will ensue: i18n will not be initialized on time, causing crashes
	loading: true,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	setLoading: (loading) => {return},
	darkMode: false,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	changeDarkMode: (dark) => {return},
	lang: '',
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	changeLanguage: async (language, afterChange) => {return}
}

export const AppStateContext = createContext<AppStateContextInterface>(emptyState)

export const useAppState: () => AppStateContextInterface = () => useContext(AppStateContext)

interface AppStateProviderProps {
	children: React.ReactNode;
}

function getTheme(dark: boolean): Theme {
	return createTheme({
		palette: {
			type: (dark) ? 'dark' : 'light',
			primary: {
				main: (dark) ? '#fff' : '#3f51b5'
			},
			text: {
				primary: (dark) ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)'
			}
		}
	})
}

export function AppStateProvider ({ children } : AppStateProviderProps) : JSX.Element {
	const savedStateHandler = useMemo(() => {
		return SavedStateHandler.getInstance(API.getUrlParams())
	}, [])
	const [loading, setLoading] = useState(true)
	const [darkMode, setDarkMode] = useState(() => savedStateHandler.getDarkMode())
	const [theme, setTheme] = useState(() => getTheme(darkMode))
	const [lang, setLang] = useState(() => savedStateHandler.getLanguage() || i18next.options.lng as string)

	const changeDarkMode = useCallback((dark: boolean) => {
		setDarkMode(dark)
		setTheme(getTheme(dark))
		savedStateHandler.setDarkMode(dark)
	}, [savedStateHandler])

	const changeLanguage = useCallback(async (language: string, afterChange: () => Promise<void>) => {
		if (language !== lang) {
			setLoading(true)
			setLang(language)
			i18next.changeLanguage(language).then(() => i18next.options.lng = language)
			API.setLanguage(language)

			savedStateHandler.setLanguage(language)

			await afterChange()
			// TODO this.buildState(true)
			setLoading(false)
		}
	}, [lang, savedStateHandler])
	
	useEffect(() => {
		API.setLanguage(lang)
	}, [])

	return (
		<AppStateContext.Provider
			value={{
				savedStateHandler,
				loading,
				setLoading,
				darkMode,
				changeDarkMode,
				lang,
				changeLanguage
			}}
		>
			<ThemeProvider theme={theme}>
				{children}
			</ThemeProvider>
		</AppStateContext.Provider>
	)
}
