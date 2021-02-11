import React from 'react'
import styles from './TopBar.module.scss'

import API, { staticData } from '../../utils/api'
import { Comparables } from '../../domain/Comparable'
import Degree from '../../domain/Degree'
import Course from '../../domain/Course'
import Shift from '../../domain/Shift'
import CourseUpdates, { CourseUpdateType } from '../../utils/CourseUpdate'

import Chip from '@material-ui/core/Chip'
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete'
import TextField from '@material-ui/core/TextField'
import Toolbar from '@material-ui/core/Toolbar'
import Tooltip from '@material-ui/core/Tooltip'
import AppBar from '@material-ui/core/AppBar'
import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/Icon'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import DialogActions from '@material-ui/core/DialogActions'
import Button from '@material-ui/core/Button'
import AcademicTerm from '../../domain/AcademicTerm'

class TopBar extends React.Component <{
	showAlert: (message: string, severity: 'success' | 'warning' | 'info' | 'error' | undefined) => void
	onSelectedCourse: (availableShifts: Shift[], selectedCourses: Course[]) => Promise<void>
	onClearShifts: () => void
	onGetLink: () => void
}, unknown>{
	state = {
		degrees: [] as Degree[],
		availableCourses: [] as Course[],
		dialog: false,
		selectedAcademicTerm: ''
	}
	availableShifts: Shift[] = []
	selectedCourses = new CourseUpdates()
	selectedDegree: Degree | null = null

	// eslint-disable-next-line
	constructor(props: any) {
		super(props)
		this.onSelectedDegree = this.onSelectedDegree.bind(this)
		this.onSelectedCourse = this.onSelectedCourse.bind(this)
	}

	async componentDidMount(): Promise<void> {
		const degrees = await API.getDegrees()
		this.setState({
			degrees: degrees ?? []
		})
		if (degrees === null) {
			this.props.showAlert('Não foi possível obter os cursos', 'error')
		}
	}

	async onSelectedDegree(degree: Degree | null): Promise<void> {
		this.selectedDegree = degree
		if (degree !== null) {
			const degreeCourses = await API.getCourses(degree.id) 
			if (degreeCourses === null) {
				this.props.showAlert('Não foi possível obter as UCs deste curso', 'error')
				return
			}
			const selected = this.selectedCourses.courses
			const availableCourses = Comparables.toUnique(degreeCourses.concat(selected)) as Course[]
			this.setState({
				availableCourses: availableCourses.sort(Course.compare)
			})
		} else {
			this.setState({
				availableCourses: this.selectedCourses.courses
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
			this.availableShifts = []
			this.selectedCourses.removeAllCourses()
			if (this.selectedDegree === null) {
				this.setState({
					availableCourses: []
				})
			}
			this.props.onSelectedCourse([] as Shift[], selectedCourses)
			return
		}

		const changedCourse = this.getCoursesDifference(this.selectedCourses.courses, selectedCourses)
		if (!changedCourse) {
			return
		}

		const currCourses = this.selectedCourses
		Object.setPrototypeOf(currCourses, CourseUpdates.prototype) // FIXME: what??
		currCourses.toggleCourse(changedCourse)
		this.selectedCourses = currCourses

		let availableShifts: Shift[]
		if (this.selectedCourses.lastUpdate?.type === CourseUpdateType.Add &&
			this.selectedCourses.lastUpdate.course !== undefined) {
			const schedule = await API.getCourseSchedules(this.selectedCourses.lastUpdate.course)
			if (schedule === null) {
				this.props.showAlert('Não foi possível obter os turnos desta UC', 'error')
				return
			}
			availableShifts = this.availableShifts.concat(schedule)
		} else if (this.selectedCourses.lastUpdate?.type === CourseUpdateType.Remove) {
			availableShifts = this.availableShifts
				.filter((shift: Shift) => shift.courseName !== this.selectedCourses.lastUpdate?.course?.name)
		} else {
			availableShifts = []
		}
		this.availableShifts = availableShifts
		this.props.onSelectedCourse(availableShifts, currCourses.courses)
	}

	onSelectedAcademicTerm(s: string): void {
		const foundArr = staticData.terms.filter( (at) => at.id === s)
		if (foundArr.length > 0) {
			const chosenAT = foundArr[0]
			API.ACADEMIC_TERM = chosenAT.term
			API.SEMESTER = chosenAT.semester
		}
		// FIXME: Remove selected courses from autocomplete
		this.onSelectedCourse([])
		this.onSelectedDegree(this.selectedDegree)
		this.setState({
			selectedAcademicTerm: s
		})
	}

	render(): React.ReactNode {
		const maxTags = 14
		const courseFilterOptions = createFilterOptions({
			stringify: (option: Course) => option.searchableName()
		})
		const maxSelectedCourses = 10

		return (
			<div className = {styles.TopBar}>
				<AppBar
					color="default"
					position="static"
				>
					<Toolbar className={styles.ToolBar}>
						<Autocomplete
							color="inherit"
							size="small"
							className={styles.degreeSelector}
							selectOnFocus
							clearOnBlur
							handleHomeEndKeys={false}
							onChange={(_, value) => this.onSelectedDegree(value)}
							noOptionsText="Sem opções"
							options={this.state.degrees}
							getOptionLabel={(option) => option.displayName()}
							renderInput={(params) => <TextField {...params} label="Escolha um curso" variant="outlined" />}
						/>
						<Autocomplete
							color="inherit"
							size="small"
							className={styles.courseSelector}
							multiple
							selectOnFocus
							clearOnBlur
							disableCloseOnSelect
							handleHomeEndKeys={false}
							limitTags={maxTags}
							onChange={(_, courses: Course[]) => this.onSelectedCourse(courses)}
							filterOptions={courseFilterOptions} options={this.state.availableCourses}
							getOptionDisabled={(option) => {
								return !option.isSelected &&
									this.selectedCourses.courses.length === maxSelectedCourses
							}}
							noOptionsText="Sem opções, escolha um curso primeiro"
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
						<Tooltip title="Obter link de partilha">
							<IconButton color="inherit" onClick={this.props.onGetLink} component="span">
								<Icon>share</Icon>
							</IconButton>
						</Tooltip>
						{/* <IconButton color='inherit' onClick={() => {this.setState({dialog: true})}} component="span">
							<Icon>settings</Icon>
						</IconButton> */}
					</Toolbar>
				</AppBar>
				<Dialog open={this.state.dialog}
					onClose={() => {this.setState({dialog: false})}}
				>
					<DialogTitle>Escolha o semestre</DialogTitle>
					<DialogContent>
						<FormControl variant='outlined'
							fullWidth={true}
						>
							<InputLabel>Semestre</InputLabel>
							<Select
								id="semester"
								value={this.state.selectedAcademicTerm}
								onChange={(e) => {this.onSelectedAcademicTerm(e.target.value as string)}}
								label="Semestre"
								// className={styles.semesterSelector}
								autoWidth={true}
							>
								{staticData.terms.map( (s) => 
									<MenuItem key={s.id} value={s.id}>{s.term} {s.semester}º Semestre
									</MenuItem>
								)}
							</Select>
						</FormControl>
					</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => {this.setState({dialog: false})}} color="primary">Guardar</Button>
					</DialogActions>
				</Dialog>
			</div>
		)
	}
}

export default TopBar