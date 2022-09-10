import { createTheme, Theme } from '@material-ui/core/styles'

export default function getTheme(dark: boolean): Theme {
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