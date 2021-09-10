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
	checklistSelected: {
		// color: theme.palette.text.primary
	},
	checklistUnselected: {
		// color: theme.palette.text.hint
		opacity: 0.8
	},
	paper: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		// border: `1px solid ${theme.palette.divider}`,
	},
	divider: {
		margin: theme.spacing(1, 0.5),
	},
	toggleGroup: {
		flexWrap: 'wrap' as const
	},
	card: {
		margin: '1% 1% 2% 1%'
	},
	cardTitle: {
		padding: '8px 16px 2px 16px'
	},
	cardContent: {
		paddingTop: '4px',
		paddingBottom: '0px'
	},
	contentCopyable: {
		userSelect: 'text' as const,
		webkitUserSelect: 'text' as const,
		oUserSelected: 'text' as const
	},
	formLabel: {
		margin: 0,
		'& .MuiTypography-root': {
			lineHeight: 0.5
		}
	},
	footer: {
		bottom: '0px',
		top: 'auto',
	},
	grow: {
		flexGrow: 1,
	},
	centered: {
		margin: 'auto'
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
