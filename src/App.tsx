import React, { ReactNode } from 'react'
import API, { staticData } from './utils/api'
import './App.scss'

import campiList from './domain/CampiList'
import Course from './domain/Course'
import Shift, { ShiftType, shortenDescriptions } from './domain/Shift'
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
import Chip from '@material-ui/core/Chip'
import Paper from '@material-ui/core/Paper'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import Backdrop from '@material-ui/core/Backdrop'
import CircularProgress from '@material-ui/core/CircularProgress'
import Divider from '@material-ui/core/Divider'
import { exportComponentAsPNG } from 'react-component-export-image'
import Snackbar from '@material-ui/core/Snackbar'
import Link from '@material-ui/core/Link'
import GitHubIcon from '@material-ui/icons/GitHub'
import Typography from '@material-ui/core/Typography'
import { returnColor } from './utils/CourseUpdate'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaypal } from '@fortawesome/free-brands-svg-icons'
import Button from '@material-ui/core/Button'

class App extends React.Component <{
	classes: CreateCSSProperties
}>{
	state = {
		selectedCourses: [] as Course[],
		availableShifts: [] as Shift[],
		shownShifts: [] as Shift[],
		selectedShifts: [] as Shift[],
		selectedCampi: [...campiList] as string[],
		selectedShiftTypes: Object.values(ShiftType) as string[],
		alertMessage: '',
		alertSeverity: undefined as 'success' | 'info' | 'warning' | 'error' | undefined,
		hasAlert: false as boolean,
		loading: true as boolean,
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
		staticData.terms = await API.getAcademicTerms()
		this.setState({
			loading: false
		})
	}

	async onSelectedCourse(availableShifts: Shift[], selectedCourses: Course[]): Promise<void> {
		const shownShifts = this.filterShifts({
			selectedCampi: this.state.selectedCampi,
			selectedShiftTypes: this.state.selectedShiftTypes,
			availableShifts: availableShifts
		})

		this.setState({
			availableShifts,
			shownShifts,
			selectedCourses
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
			const shiftCourse = this.state.selectedCourses.filter( (c) => c.id === chosenShift.courseId)

			// Verify if of the same type and course to replace, but not the same
			const replacingIndex = Comparables.indexOfBy(this.state.selectedShifts, chosenShift, Shift.isSameCourseAndType)
			const selectedShifts = this.state.selectedShifts
			
			// Verify if shift is already selected and unselect
			const idx = Comparables.indexOf(selectedShifts, chosenShift)
			if (idx === -1) {
				selectedShifts.push(chosenShift)
				if (replacingIndex !== -1) {
					selectedShifts.splice(replacingIndex, 1)  
				} else if (shiftCourse.length === 1) {
					shiftCourse[0].addSelectedShift(chosenShift)
				}
			} else {
				selectedShifts.splice(idx, 1)
				if (shiftCourse.length === 1) {
					shiftCourse[0].removeSelectedShift(chosenShift)
				}
			}

			this.setState({
				selectedShifts: [...selectedShifts]
			})
			this.changeUrl(true)
		}
	}

	clearSelectedShifts(): void {
		if (this.state.selectedShifts.length !== 0) {
			this.state.selectedCourses.forEach( (c) => {
				c.clearSelectedShifts()
				if (!c.isSelected && !c.hasShiftsSelected) {
					returnColor(c.removeColor())
				}
			})
			this.setState({
				selectedShifts: []
			})
			this.showAlert('Horário limpo com sucesso', 'success')
			this.changeUrl(false)
		}
	}

	getCoursesBySelectedShifts(): Course[] {
		const finalCourses = [...this.state.selectedCourses]
		// let courses: Record<string, Course> = {}
		this.state.selectedShifts.forEach( (s) => {
			// FIXME: Includes? hmmmm
			// finalCourses = Comparables.addToSet(finalCourses, s.course) as Record<string, Course>
			if (!finalCourses.includes(s.course)) {
				finalCourses.push(s.course)
			}
		})
		return finalCourses.sort(Course.compare)
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
		const state = shortenDescriptions(this.state.selectedShifts)
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
	// 	const title: string = document.title
	// 	let path: string = window.location.pathname
	// 	if (toState) {
	// 		path = (path + `/?s=${btoa(JSON.stringify(this.state.selectedShifts))}`).replace('//', '/')
	// 	}
	// 	if (window.history.replaceState) {
	// 		window.history.replaceState({}, title, path)
	// 	} else {
	// 		window.history.pushState({}, title, path)
	// 	}
	}

	async buildCourse(description: string[]): Promise<void> {
		const course = await API.getCourse(description[0])
		if (!course) {
			throw 'Could not build course'
		}
		course.isSelected = true
		const schedule = await API.getCourseSchedules(course)
		if (!schedule) {
			throw 'Could not fetch course schedule'
		}
		this.setState({
			availableShifts: [...this.state.availableShifts, ...schedule]
		})

		const selectedShiftIds = description.slice(1)
		const selectedShifts = schedule.reduce((acc: Shift[], shift: Shift) => {
			if (selectedShiftIds.includes(shift.shiftId)) {
				acc.push(shift)
			}
			return acc
		}, [] as Shift[])

		this.setState({
			selectedShifts: this.state.selectedShifts.concat(selectedShifts)
		})
	}

	async buildState(param: string | undefined): Promise<void> {
		if (!param) {
			return
		}

		try {
			// TODO: rebuild colors and domain chosen for the courses
			// /(\d)+((T|PB|L|S)[\d]{2})+/
			param.split(';')
				.map((shift: string) => shift.split('~'))
				.forEach((description: string[]) => this.buildCourse(description))
			this.changeUrl(true)
		} catch (err) {
			console.error(err)
			// ignored, bad URL
		}
	}

	saveSchedule(): void {
		if (this.state.selectedShifts.length === 0) {
			this.showAlert('Não tem nenhum turno selecionado, faça o seu horário primeiro', 'info')
			return
		}
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
			}
		}))(ToggleButtonGroup)


		return (
			<div className="App">
				<Backdrop className={classes.backdrop as string} open={this.state.loading}>
					<CircularProgress color="inherit" />
				</Backdrop>
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
											className={classes.toggleGroup as string}
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
											className={classes.toggleGroup as string}
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
									<div style={{display: 'flex', flexGrow: 1, flexWrap: 'wrap'}}>
										{this.getCoursesBySelectedShifts().map((c) => (
											<Paper elevation={0} variant={'outlined'} key={c.id}
												style={{padding: '4px', margin: '4px', display: 'flex'}}
											>
												<Tooltip title={c.name} key={c.id}>
													<Chip size="small" color='primary'
														style={{backgroundColor: c.color}} label={c.acronym}
													/>
												</Tooltip>
												{Array.from(c.getShiftsDisplay()).map( (s) => (
													<Paper elevation={0} key={s[0]}
														style={{marginLeft: '4px', marginRight: '4px',
															color: s[1] ? '#000' : 'rgba(0, 0, 0, 0.26)'}}
													>
														<Typography variant='body1' style={{ fontWeight: 500 }}>{s[0]}</Typography>
													</Paper>
												))}
											</Paper>
										))}
									</div>
									<div className={classes.centered as string}>
										<Tooltip title="Guardar como imagem">
											<IconButton
												disabled={this.state.selectedShifts.length === 0}
												color="inherit"
												onClick={this.saveSchedule}
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
							<Tooltip title="Apoiar com uma doação">
								<Link href="https://paypal.me/DanielG5?locale.x=pt_PT" target="_blank" onClick={() => {return}} color="inherit">
									<Button color='default' variant='outlined'
										startIcon={<FontAwesomeIcon icon={faPaypal}/>}
										size='small'
									>Apoiar
									</Button>
								</Link>
							</Tooltip>
							<div className={classes.grow as string} />
							<Tooltip title="Ver código fonte">
								<Link href="https://github.com/joaocmd/Criador-Horarios" target="_blank" onClick={() => {return}} color="inherit">
									<IconButton color="inherit" onClick={() => {return}} component="span">
										<GitHubIcon></GitHubIcon>
									</IconButton>
								</Link>
							</Tooltip>
							<Tooltip title="João David">
								<Link href="https://github.com/joaocmd" target="_blank" onClick={() => {return}} color="inherit">
									<IconButton size="small" title="João David" onClick={() => {return}}>
										<Avatar alt="Joao David" src={`${process.env.PUBLIC_URL}/img/joao.png`} />
									</IconButton>
								</Link>
							</Tooltip>
							<Tooltip title="Daniel Gonçalves">
								<Link href="https://dagoncalves.me" target="_blank" onClick={() => {return}} color="inherit">
									<IconButton size="small" title="Daniel Gonçalves" onClick={() => {return}}>
										<Avatar alt="Daniel Goncalves" src={`${process.env.PUBLIC_URL}/img/daniel.png`} />
									</IconButton>
								</Link>
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
	backdrop: {
		zIndex: theme.zIndex.drawer + 1,
		color: '#fff',
	},
	paper: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		border: `1px solid ${theme.palette.divider}`,
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
