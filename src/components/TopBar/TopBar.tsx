import React from 'react'
import styles from './TopBar.module.scss'

import API from '../../utils/api'
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
import { withSnackbar } from 'notistack'

class TopBar extends React.PureComponent <{
  onSelectedCourse: (availableShifts: Shift[]) => Promise<void>
  onClearShifts: () => void
  onGetLink: () => void
}, unknown>{
	state = {
		degrees: [] as Degree[],
		availableCourses: [] as Course[]
	}
	availableCourses: Course[] = []
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
			alert('AHHHHHHHHHHHH')
			// this.showAlert('Não foi possível obter os cursos', 'error')
		}
	}

	async onSelectedDegree(degree: Degree | null): Promise<void> {
		this.selectedDegree = degree
		if (degree !== null) {
			const degreeCourses = await API.getCourses(degree.id) 
			if (degreeCourses === null) {
				alert('ASKDLASDJLKSDALKKL')
				// this.showAlert('Não foi possível obter as UCs deste curso', 'error')
				return
			}
			const selected = this.selectedCourses.courses
			const availableCourses = Comparables.toUnique(degreeCourses.concat(selected)) as Course[]
			availableCourses.sort(Course.compare)
			this.setState({
				availableCourses
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
			// FIXME: Does this need to be a setState?
			this.setState(() => {
				const currCourses = new CourseUpdates()
				currCourses.lastUpdate = { course: undefined, type: CourseUpdateType.Clear}
				currCourses.courses = []
				// eslint-disable-next-line
				const update: any = { }
				this.availableShifts = []
				this.selectedCourses = currCourses
				if (this.selectedDegree === null) {
					this.availableCourses = []
				}
				return update
			})
			this.props.onSelectedCourse([] as Shift[])
			return
		}

		const changedCourse = this.getCoursesDifference(this.selectedCourses.courses, selectedCourses)
		if (!changedCourse) {
			return
		}

		const currCourses = this.selectedCourses
		Object.setPrototypeOf(currCourses, CourseUpdates.prototype) // FIXME: what??
		currCourses.toggleCourse(changedCourse)

		let availableShifts: Shift[]
		if (this.selectedCourses.lastUpdate?.type === CourseUpdateType.Add &&
			this.selectedCourses.lastUpdate.course !== undefined) {
			const schedule = await API.getCourseSchedules(this.selectedCourses.lastUpdate.course)
			if (schedule === null) {
				alert('ASKLDKLASDJKLDASJKLDASKL')
				// this.showAlert('Não foi possível obter os turnos desta UC', 'error')
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
		this.props.onSelectedCourse(availableShifts)
	}

	render(): React.ReactNode {
		const maxTags = 14
		const courseFilterOptions = createFilterOptions({
			stringify: (option: Course) => option.searchableName()
		})

		return (
			<div className = {styles.TopBar}>
				<AppBar
					color="default"
					position="static"
				>
					<Toolbar>
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
							<IconButton color="inherit" onClick={this.props.onGetLink} component="span" disabled={false}>
								<Icon>share</Icon>
							</IconButton>
						</Tooltip>
					</Toolbar>
				</AppBar>
			</div>
		)
	}
}

export default TopBar
