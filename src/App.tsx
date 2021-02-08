import React, { ReactNode } from 'react'
import API from './utils/api'

import {
	campiList,
	Course,
	CourseUpdates,
	CourseUpdateType,
	Degree,
	Shift,
	ShiftType,
	Lesson
} from './utils/domain'
import Comparables from './utils/comparables'
import Schedule from './components/Schedule/Schedule'
import './App.scss'

import withStyles, { CreateCSSProperties } from '@material-ui/core/styles/withStyles'
import Avatar from '@material-ui/core/Avatar'
import Chip from '@material-ui/core/Chip'
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete'
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip'
import Toolbar from '@material-ui/core/Toolbar'
import Alert from '@material-ui/lab/Alert'
import AppBar from '@material-ui/core/AppBar'
import TextField from '@material-ui/core/TextField'
import Icon from '@material-ui/core/Icon'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import FilterList from '@material-ui/icons/FilterList'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import Paper from '@material-ui/core/Paper'
import ToggleButton from '@material-ui/lab/ToggleButton'
import Divider from '@material-ui/core/Divider'
import { exportComponentAsPNG } from 'react-component-export-image'
import Snackbar from '@material-ui/core/Snackbar'
import Collapse from '@material-ui/core/Collapse'
import Grid from '@material-ui/core/Grid'

class App extends React.Component <{
	classes: CreateCSSProperties
}>{
	state = {
		availableCourses: [] as Course[],
		selectedCourses: new CourseUpdates(),
		availableShifts: [] as Shift[],
		shownShifts: [] as Shift[],
		selectedShifts: [] as Shift[],
		selectedCampus: campiList as string[],
		selectedShiftTypes: Object.values(ShiftType) as string[],
		alertMessage: '',
		alertSeverity: undefined as 'success' | 'info' | 'warning' | 'error' | undefined,
		hasAlert: false as boolean,
		filtersVisible: false
	}
	degrees: Degree[] = []
	selectedDegree: Degree | null = null
	chosenSchedule: React.RefObject<Schedule>

	constructor(props: Readonly<{ classes: CreateCSSProperties<any>; }>) {
		super(props)
		this.onSelectedDegree = this.onSelectedDegree.bind(this)
		this.onSelectedCourse = this.onSelectedCourse.bind(this)
		this.onSelectedShift = this.onSelectedShift.bind(this)
		this.clearSelectedShifts = this.clearSelectedShifts.bind(this)
		this.getShortLink = this.getShortLink.bind(this)
		this.changeCampus = this.changeCampus.bind(this)
		this.saveSchedule = this.saveSchedule.bind(this)
		this.handleCloseAlert = this.handleCloseAlert.bind(this)
		this.changeFiltersVisibility = this.changeFiltersVisibility.bind(this)
		this.chosenSchedule = React.createRef()
	}

	async componentDidMount() {
		const degrees = await API.getDegrees()
		if (degrees !== null) {
			this.degrees = degrees
		} else {
			this.degrees = []
			this.showAlert('Não foi possível obter os cursos', 'error')
		}
		const queryParam = /\?s=(.*)$/
		await this.buildState(window.location.href.match(queryParam)?.[1])
		this.forceUpdate()
	}

	async onSelectedDegree(degree: Degree | null): Promise<void> {
		this.selectedDegree = degree
		if (degree !== null) {
			const degreeCourses = await API.getCourses(degree.id) 
			if (degreeCourses === null) {
				this.showAlert('Não foi possível obter as UCs deste curso', 'error')
				return
			}
			const selected = this.state.selectedCourses.courses
			const availableCourses = Comparables.toUnique(degreeCourses.concat(selected)) as Course[]
			availableCourses.sort(Course.compare)
			this.setState({
				availableCourses
			})
		} else {
			this.setState({
				availableCourses: this.state.selectedCourses.courses
			})
		}
	}

	getCoursesDifference(prevCourses: Course[], courses: Course[]): Course | undefined {
		const prevSet = Comparables.toUnique(prevCourses)
		const newSet = Comparables.toUnique(courses)

		if (prevSet.length === newSet.length) {
			// Nothing changed
			return undefined
		} else if (prevSet.length === newSet.length + 1) {
			// Removed element, find missing in courses
			return prevCourses.find((c: Course) => !Comparables.includes(courses, c))
		} else if (prevSet.length === newSet.length - 1) {
			// Added element, return first last on courses
			return courses[courses.length - 1]
		}
	}

	//FIXME: Available courses not updating when a course from another degree is removed 
	async onSelectedCourse(selectedCourses: Course[]): Promise<void> {
		if (selectedCourses.length === 0) {
			this.setState(() => {
				const currCourses = new CourseUpdates()
				currCourses.lastUpdate = { course: undefined, type: CourseUpdateType.Clear}
				// eslint-disable-next-line
				const update: any = { selectedCourses: { ...currCourses}, availableShifts: [], shownShifts: [] }
				if (this.selectedDegree === null) {
					update.availableCourses = []
				}
				return update
			})
			return
		}

		const changedCourse = this.getCoursesDifference(this.state.selectedCourses.courses, selectedCourses)
		if (!changedCourse) {
			return
		}

		const currCourses = this.state.selectedCourses
		Object.setPrototypeOf(currCourses, CourseUpdates.prototype) // FIXME: what??
		currCourses.toggleCourse(changedCourse!)

		let availableShifts: Shift[]
		if (this.state.selectedCourses.lastUpdate?.type === CourseUpdateType.Add) {
			const schedule = await API.getCourseSchedules(this.state.selectedCourses.lastUpdate.course!)
			if (schedule === null) {
				this.showAlert('Não foi possível obter os turnos desta UC', 'error')
				return
			}
			availableShifts = this.state.availableShifts.concat(schedule)
		} else if (this.state.selectedCourses.lastUpdate?.type === CourseUpdateType.Remove) {
			availableShifts = this.state.availableShifts
				.filter((shift: Shift) => shift.courseName !== this.state.selectedCourses.lastUpdate?.course?.name)
		} else {
			availableShifts = []
		}

		const shownShifts = this.filterShifts({
			selectedCampus: this.state.selectedCampus,
			selectedShiftTypes: this.state.selectedShiftTypes,
			availableShifts: availableShifts
		})

		this.setState({
			selectedCourses: { ...currCourses },
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
		if (this.state.selectedShifts.length === 0) {
			this.showAlert('Não tem nenhum turno selecionado, faça o seu horário primeiro', 'info')
		} else {
			this.setState({
				selectedShifts: []
			})
			this.changeUrl(false)
		}
	}

	changeCampus(campi: string[]): void {
		const shownShifts = this.filterShifts({
			selectedCampus: campi,
			selectedShiftTypes: this.state.selectedShiftTypes,
			availableShifts: this.state.availableShifts
		})

		this.setState({
			selectedCampus: campi,
			shownShifts
		})
	}

	changeShiftType(types: string[]): void {
		const shownShifts = this.filterShifts({
			selectedCampus: this.state.selectedCampus,
			selectedShiftTypes: types,
			availableShifts: this.state.availableShifts
		})

		this.setState({
			selectedShiftTypes: types,
			shownShifts
		})
	}

	filterShifts(state: {selectedCampus: string[], selectedShiftTypes: string[], availableShifts: Shift[]}): Shift[] {
		return state.availableShifts.filter( (s) => {
			const campi = state.selectedCampus.includes(s.campus)
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

	async getShortLink(): Promise<void> {
		if (this.state.selectedShifts.length === 0) {
			this.showAlert('Nada para partilhar, faça o seu horário primeiro', 'warning')
			return
		}

		const shortLink = await API.getShortUrl()
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
		exportComponentAsPNG(this.chosenSchedule, {fileName: 'ist-horario'})
		this.showAlert('Horário convertido em imagem', 'success')
	}

	changeFiltersVisibility(): void {
		this.setState({
			filtersVisible: !this.state.filtersVisible
		})
	}

	render(): ReactNode {
		const courseFilterOptions = createFilterOptions({
			stringify: (option: Course) => option.searchableName()
		})

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

		const maxTags = 14
		const { classes } = this.props

		return (
			<div className="App">
				<header className="App-header">
				</header>
				<div className="main">
					<div className="topbar">
						<AppBar
							color="transparent"
							position="static"
						>
							<Toolbar>
								<Tooltip title="Mostrar/esconder filtros">
									<IconButton color="inherit" onClick={this.changeFiltersVisibility} component="span">
										<FilterList />
									</IconButton>
								</Tooltip>
								<Autocomplete
									color="inherit"
									size="small"
									className="selector course-selector"
									selectOnFocus
									clearOnBlur
									handleHomeEndKeys={false}
									onChange={(_, value) => this.onSelectedDegree(value)}
									noOptionsText="Sem opções"
									options={this.degrees}
									getOptionLabel={(option) => option.displayName()}
									renderInput={(params) => <TextField {...params} label="Escolha um curso" variant="outlined" />}
								/>
								<Autocomplete
									color="inherit"
									size="small"
									className="selector"
									multiple
									selectOnFocus
									clearOnBlur
									disableCloseOnSelect
									handleHomeEndKeys={false}
									limitTags={maxTags}
									onChange={(_, courses: Course[]) => this.onSelectedCourse(courses)}
									filterOptions={courseFilterOptions} options={this.state.availableCourses}
									noOptionsText="Sem opções, escolha um curso primeiro"
									// getOptionDisabled={(_) => this.state.courses.length === maxSelectedCourses ? true : false}
									getOptionLabel={(option) => option.displayName()}
									renderInput={(params) => <TextField  {...params} label="Escolha as UCs" variant="outlined" />}
									renderTags={(tagValue, getTagProps) => {
										return tagValue.map((option, index) => (
											<Tooltip title={option.name} key={option.name}>
												<Chip {...getTagProps({ index })} size="small" color='primary' style={{backgroundColor: option.color}} label={option.acronym} />
											</Tooltip>
										))
									}}
								/>
								<Tooltip title="Limpar horário">
									<IconButton color="inherit" onClick={this.clearSelectedShifts} component="span">
										<Icon>delete</Icon>
									</IconButton>
								</Tooltip>
								<Tooltip title="Obter link de partilha">
									<IconButton color="inherit" onClick={this.getShortLink} component="span" disabled={false}>
										<Icon>share</Icon>
									</IconButton>
								</Tooltip>
							</Toolbar>
							<Collapse in={this.state.filtersVisible} timeout="auto" unmountOnExit>
								<Toolbar>
									<Paper elevation={0} className={classes.paper as string}>
										<StyledToggleButtonGroup
											size="small"
											value={this.state.selectedCampus}
											onChange={(_, value) => this.changeCampus(value as string[])}
											aria-label="text alignment"
										>
											{campiList.map((name) => (
												<ToggleButton key={name} value={name}>{name}</ToggleButton>
											))}
										</StyledToggleButtonGroup>
										<Divider flexItem orientation="vertical" className={classes.divider as string}/>
										<StyledToggleButtonGroup
											size="small"
											value={this.state.selectedShiftTypes}
											onChange={(_, value) => this.changeShiftType(value as string[])}
										>
											{Object.entries(ShiftType).map((name) => (
												<ToggleButton key={name[1]} value={name[1]}>{name[0]}</ToggleButton>
											))}        
										</StyledToggleButtonGroup>
									</Paper>
								</Toolbar>
							</Collapse>
						</AppBar>
					</div>
					<Snackbar open={this.state.hasAlert}
						autoHideDuration={3000}
						onClose={this.handleCloseAlert}
						anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
						<Alert
							action={<IconButton size='small' onClick={this.handleCloseAlert}><Icon>close</Icon></IconButton>}
							severity={this.state.alertSeverity}>
							{this.state.alertMessage}
						</Alert>
					</Snackbar>
					<div className="body">
						<div className="bg-image" />
						<div className="schedules">
							<Card className={classes.card as string}>
								<CardContent>
									<Schedule onSelectedEvent={(id: string) => this.onSelectedShift(id, this.state.availableShifts)}
										events={this.getAllLessons()}
									/>
									<Tooltip title="Aqui aparecem todos os turnos, carregue neles para os escolher">
										<IconButton color="inherit" disabled={false} component="span">
											<Icon color="action">help</Icon>
										</IconButton>
									</Tooltip>
								</CardContent>
							</Card>
							<Card className={classes.card as string}>
								<CardContent>
									<Schedule onSelectedEvent={(id: string) => this.onSelectedShift(id, this.state.selectedShifts)}
										events={this.getSelectedLessons()} ref={this.chosenSchedule}
									/>
									<Tooltip title="O seu horário aparece aqui, carregue nele para remover turnos">
										<IconButton color="inherit" disabled={false} component="span">
											<Icon color="action">help</Icon>
										</IconButton>
									</Tooltip>
									<IconButton color="inherit" onClick={this.saveSchedule} component="span">
										<Icon>download</Icon>
									</IconButton>
								</CardContent>
							</Card>
						</div>
					</div>
					<div className="footer">
						<AppBar className={classes.footer as string} color="transparent">
							<Toolbar>
								<div className={classes.grow as string} />
								<Avatar alt="Joao David" src={`${process.env.PUBLIC_URL}/img/joao.png`} />
								<Avatar alt="Daniel Goncalves" src={`${process.env.PUBLIC_URL}/img/daniel.png`} />
							</Toolbar>													
						</AppBar>
					</div>
				</div>
			</div>
		)
	}
}

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
		margin: '2% 1% 1% 1%'
	},
	footer: {
		bottom: 0,
		top: 'auto',
	},
	grow: {
		flexGrow: 1,
	}
})

export default withStyles(styles)(App)
