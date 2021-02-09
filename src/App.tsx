import React, { ReactNode } from 'react'
import API from './utils/api'
import './App.scss'

import campiList from './domain/CampiList'
import Shift, { ShiftType } from './domain/Shift'
import Lesson from './domain/Lesson'
import { Comparables } from './domain/Comparable'
import Schedule from './components/Schedule/Schedule'
import TopBar from './components/TopBar/TopBar'

import withStyles, { CreateCSSProperties } from '@material-ui/core/styles/withStyles'
import Avatar from '@material-ui/core/Avatar'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import Toolbar from '@material-ui/core/Toolbar'
import Alert from '@material-ui/lab/Alert'
import AppBar from '@material-ui/core/AppBar'
import Icon from '@material-ui/core/Icon'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Paper from '@material-ui/core/Paper'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import Divider from '@material-ui/core/Divider'
import { exportComponentAsPNG } from 'react-component-export-image'
import Snackbar from '@material-ui/core/Snackbar'
import Link from '@material-ui/core/Link'
import GitHubIcon from '@material-ui/icons/GitHub'

class App extends React.Component <{
	classes: CreateCSSProperties
}>{
	state = {
		availableShifts: [] as Shift[],
		shownShifts: [] as Shift[],
		selectedShifts: [] as Shift[],
		selectedCampi: [...campiList] as string[],
		selectedShiftTypes: Object.values(ShiftType) as string[],
		alertMessage: '',
		alertSeverity: undefined as 'success' | 'info' | 'warning' | 'error' | undefined,
		hasAlert: false as boolean,
	}
	chosenSchedule: React.RefObject<Schedule>

	// eslint-disable-next-line
	constructor(props: any) {
		super(props)
		this.onSelectedCourse = this.onSelectedCourse.bind(this)
		this.onSelectedShift = this.onSelectedShift.bind(this)
		this.clearSelectedShifts = this.clearSelectedShifts.bind(this)
		this.getLink = this.getLink.bind(this)
		this.changeCampi = this.changeCampi.bind(this)
		this.saveSchedule = this.saveSchedule.bind(this)
		this.handleCloseAlert = this.handleCloseAlert.bind(this)
		this.showAlert = this.showAlert.bind(this)
		this.chosenSchedule = React.createRef()
	}

	async componentDidMount() {
		const queryParam = /\?s=(.*)$/
		await this.buildState(window.location.href.match(queryParam)?.[1])
		this.forceUpdate()
	}

	async onSelectedCourse(availableShifts: Shift[]): Promise<void> {
		const shownShifts = this.filterShifts({
			selectedCampi: this.state.selectedCampi,
			selectedShiftTypes: this.state.selectedShiftTypes,
			availableShifts: availableShifts
		})

		this.setState({
			availableShifts,
			shownShifts
		})
	}

	getAllLessons(): Lesson[] {
		return this.state.shownShifts.map((shift: Shift) => shift.lessons).flat()
	}

	getSelectedLessons(): Lesson[] {
		return this.state.selectedShifts.map((shift: Shift) => shift.lessons).flat()
	}

	onSelectedShift(shiftName: string, arr: Shift[]): void {
		const chosenShift = arr.find((s: Shift) => s.name === shiftName)

		if (chosenShift) {
			// Verify if of the same type and course to replace, but not the same
			const replacingIndex = Comparables.indexOfBy(this.state.selectedShifts, chosenShift, Shift.isSameCourseAndType)
			const selectedShifts = this.state.selectedShifts
			
			// Verify if shift is already selected and unselect
			const idx = Comparables.indexOf(selectedShifts, chosenShift)
			if (idx === -1) {
				selectedShifts.push(chosenShift)
				if (replacingIndex !== -1) {
					selectedShifts.splice(replacingIndex, 1)  
				}
			} else {
				selectedShifts.splice(idx, 1)
			}

			this.setState({
				selectedShifts: [...selectedShifts]
			})
			this.changeUrl(true)
		}
	}

	clearSelectedShifts(): void {
		if (this.state.selectedShifts.length !== 0) {
			this.setState({
				selectedShifts: []
			})
			this.showAlert('Horário limpo com sucesso', 'success')
			this.changeUrl(false)
		}
	}

	changeCampi(campi: string[]): void {
		const shownShifts = this.filterShifts({
			selectedCampi: campi,
			selectedShiftTypes: this.state.selectedShiftTypes,
			availableShifts: this.state.availableShifts
		})

		this.setState({
			selectedCampi: campi,
			shownShifts
		})
	}

	changeShiftTypes(types: string[]): void {
		const shownShifts = this.filterShifts({
			selectedCampi: this.state.selectedCampi,
			selectedShiftTypes: types,
			availableShifts: this.state.availableShifts
		})

		this.setState({
			selectedShiftTypes: types,
			shownShifts
		})
	}

	filterShifts(state: {selectedCampi: string[], selectedShiftTypes: string[], availableShifts: Shift[]}): Shift[] {
		return state.availableShifts.filter( (s) => {
			const campi = state.selectedCampi.includes(s.campus)
			const type = state.selectedShiftTypes.includes(s.type)
			return campi && type
		})
	}

	showAlert(message: string, severity: 'success' | 'warning' | 'info' | 'error' | undefined): void {
		this.setState({
			alertMessage: message,
			alertSeverity: severity,
			hasAlert: true
		})
	}

	handleCloseAlert(): void {
		this.setState({
			hasAlert: false
		})
	}

	async getLink(): Promise<void> {
		const state = this.state.selectedShifts.map((s) => s.getShortDescription()).join(';')
		const shortLink = await API.getShortUrl(state)
		const el = document.createElement('textarea')
		el.value = shortLink
		el.setAttribute('readonly', '')
		el.style.display = 'hidden'
		document.body.appendChild(el)
		el.select()
		document.execCommand('copy')

		document.body.removeChild(el)
		this.showAlert('Sucesso! Link copiado para a sua área de transferência', 'success')
	}

	changeUrl(toState: boolean): void {
		// FIXME: Preventing big URLs for now
		return
		const title: string = document.title
		let path: string = window.location.pathname
		if (toState) {
			path = (path + `/?s=${btoa(JSON.stringify(this.state.selectedShifts))}`).replace('//', '/')
		}
		if (window.history.replaceState) {
			window.history.replaceState({}, title, path)
		} else {
			window.history.pushState({}, title, path)
		}
	}

	async buildState(param: string | undefined): Promise<void> {
		if (!param) {
			return
		}

		try {
			// TODO: rebuild colors and domain chosen for the courses
			const shifts: Shift[] = JSON.parse(atob(param))
			// Set prototypes for each object received
			shifts.forEach((s) => {
				Object.setPrototypeOf(s, Shift.prototype)
				s.lessons.forEach((l) => Object.setPrototypeOf(l, Lesson.prototype))
			})
			
			this.setState({
				selectedShifts: [...shifts]
			})
			this.changeUrl(true)
		} catch (err) {
			console.error(err)
			// ignored, bad URL
		}
	}

	saveSchedule(): void {
		exportComponentAsPNG(this.chosenSchedule, {
			fileName: 'ist-horario',
			html2CanvasOptions: {
				backgroundColor: undefined,
				allowTaint: true,
			}
		})
	
		this.showAlert('Horário convertido em imagem', 'success')
	}

	render(): ReactNode {
		const classes = this.props.classes

		const StyledToggleButtonGroup = withStyles((theme) => ({
			grouped: {
				margin: theme.spacing(0.5),
				border: 'none',
				'&:not(:first-child)': {
					borderRadius: theme.shape.borderRadius,
				},
				'&:first-child': {
					borderRadius: theme.shape.borderRadius,
				},
			},
		}))(ToggleButtonGroup)


		return (
			<div className="App">
				<TopBar
					onSelectedCourse={this.onSelectedCourse}
					onClearShifts={this.clearSelectedShifts}
					onGetLink={this.getLink}
					showAlert={this.showAlert}
				>
				</TopBar>
				<div className="main">
					<Snackbar
						open={this.state.hasAlert}
						autoHideDuration={3000}
						onClose={this.handleCloseAlert}
						anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
						<Alert
							action={<IconButton size='small' onClick={this.handleCloseAlert}><Icon>close</Icon></IconButton>}
							severity={this.state.alertSeverity}>
							{this.state.alertMessage}
						</Alert>
					</Snackbar>
					<div className={classes.body as string}>
						<div className="schedules">
							<Card className={classes.card as string}>
								<CardContent className={classes.cardContent as string}>
									<Schedule
										onSelectedEvent={(id: string) => this.onSelectedShift(id, this.state.availableShifts)}
										events={this.getAllLessons()}
									/>
								</CardContent>
								<CardActions>
									<Paper elevation={0} className={`${classes.paper as string} ${classes.centered as string}`}>
										<StyledToggleButtonGroup
											size="small"
											value={this.state.selectedCampi}
											onChange={(_, value) => this.changeCampi(value as string[])}
											aria-label="text alignment"
										>
											{campiList.map((name: string) => (
												<ToggleButton key={name} value={name}>{name}</ToggleButton>
											))}
										</StyledToggleButtonGroup>
										<Divider flexItem orientation="vertical" className={classes.divider as string}/>
										<StyledToggleButtonGroup
											size="small"
											value={this.state.selectedShiftTypes}
											onChange={(_, value) => this.changeShiftTypes(value as string[])}
										>
											{Object.entries(ShiftType).map((name) => (
												<ToggleButton key={name[1]} value={name[1]}>{name[0]}</ToggleButton>
											))}        
										</StyledToggleButtonGroup>
									</Paper>
								</CardActions>
							</Card>
							<Card className={classes.card as string}>
								<CardContent className={classes.cardContent as string}>
									<Schedule
										onSelectedEvent={(id: string) => this.onSelectedShift(id, this.state.selectedShifts)}
										events={this.getSelectedLessons()} ref={this.chosenSchedule}
									/>
								</CardContent>
								<CardActions>
									<div className={classes.centered as string}>
										<Tooltip title="Guardar como imagem">
											<IconButton
												disabled={this.state.selectedShifts.length === 0}
												color="inherit"
												onClick={this.clearSelectedShifts}
												component="span">
												<Icon>download</Icon>
											</IconButton>
										</Tooltip>
										<Tooltip title="Limpar horário">
											<IconButton
												disabled={this.state.selectedShifts.length === 0}
												color="inherit"
												onClick={this.clearSelectedShifts}
												component="span">
												<Icon>delete</Icon>
											</IconButton>
										</Tooltip>
									</div>
								</CardActions>
							</Card>
						</div>
					</div>
				</div>
				<div className="footer">
					<AppBar className={classes.footer as string} color="default" position="sticky">
						<Toolbar>
							<div className={classes.grow as string} />
							<Link href="https://github.com/joaocmd/Criador-Horarios/" target="_blank" onClick={() => {return}} color="inherit">
								<IconButton color="inherit" onClick={() => {return}} component="span">
									<GitHubIcon></GitHubIcon>
								</IconButton>
							</Link>
							<Tooltip title="João David">
								<Avatar alt="Joao David" src={`${process.env.PUBLIC_URL}/img/joao.png`} />
							</Tooltip>
							<Tooltip title="Daniel Gonçalves">
								<Avatar alt="Daniel Goncalves" src={`${process.env.PUBLIC_URL}/img/daniel.png`} />
							</Tooltip>
						</Toolbar>													
					</AppBar>
				</div>
			</div>
		)
	}
}

const cssVariables = {
	blur: '5px',
	brightness: 1
}

// eslint-disable-next-line
const styles = (theme: any) => ({
	paper: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		border: `1px solid ${theme.palette.divider}`,
	},
	divider: {
		margin: theme.spacing(1, 0.5),
	},
	card: {
		margin: '1% 1% 2% 1%'
	},
	cardContent: {
		paddingBottom: '0px'
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

export default withStyles(styles)(App)
