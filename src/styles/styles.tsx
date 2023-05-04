const cssVariables = {
	blur: '5px',
	brightness: 1
}

// eslint-disable-next-line
export const APP_STYLES = (theme: any) => ({
	backdrop: {
		zIndex: theme.zIndex.drawer + 1,
		color: '#fff',
		background: 'rgba(0,0,0,0.85)',
	},
	contentCopyable: {
		userSelect: 'text' as const,
		webkitUserSelect: 'text' as const,
		oUserSelected: 'text' as const
	},
	body: {
		height: '100%',
		'&::before': {
			content: '""',
			position: 'fixed',
			top: '-5%',
			left: '-5%',
			right: 0,
			zIndex: -1,

			display: 'block',
			backgroundImage: `url(${process.env.PUBLIC_URL}/img/background.jpg)`,
			backgroundSize: 'cover',
			width: '110%',
			height: '110%',

			webkitFilter: `blur(${cssVariables.blur}) brightness(${cssVariables.brightness})`,
			mozFilter: `blur(${cssVariables.blur}) brightness(${cssVariables.brightness})`,
			oFilter: `blur(${cssVariables.blur}) brightness(${cssVariables.brightness})`,
			msFilter: `blur(${cssVariables.blur}) brightness(${cssVariables.brightness})`,
			filter: `blur(${cssVariables.blur}) brightness(${cssVariables.brightness})`,
		}
	}
})
