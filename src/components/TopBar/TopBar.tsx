import React from 'react'
import styles from './TopBar.module.scss'

import API, { staticData, defineCurrentTerm } from '../../utils/api'
import { Comparables } from '../../domain/Comparable'
import Degree from '../../domain/Degree'
import Course from '../../domain/Course'
import Shift from '../../domain/Shift'
import CourseUpdates from '../../utils/CourseUpdate'

import Divider from '@material-ui/core/Divider'
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

import Brightness2Icon from '@material-ui/icons/Brightness2'
import Brightness5Icon from '@material-ui/icons/Brightness5'

import i18next from 'i18next'
import Menu from '@material-ui/core/Menu'
import Avatar from '@material-ui/core/Avatar'
import Typography from '@material-ui/core/Typography'
import OccupancyUpdater, { occupancyRates } from '../../utils/occupancy-updater'
import SavedStateHandler from '../../utils/saved-state-handler'
import AcademicTerm from '../../domain/AcademicTerm'
import Timetable from '../../domain/Timetable'

class TopBar extends React.Component <{
	showAlert: (message: string, severity: 'success' | 'warning' | 'info' | 'error' | undefined) => void
	onSelectedCourse: (selectedCourses: Course[]) => Promise<void>
	onSelectedDegree: (selectedDegrees: Degree[]) => Promise<void>
	onClearShifts: (alert: boolean) => void
	onChangeLanguage: (language: string, afterChange: () => Promise<void>) => void
	darkMode: boolean
	onChangeDarkMode: (dark: boolean) => void
	currentTimetable: Timetable
}, unknown>{
	state = {
		degrees: [] as Degree[],
		availableCourses: [] as Course[],
		selectedAcademicTerm: '',
		selectedCourses: new CourseUpdates(),
		hasSelectedShifts: false,
		settingsDialog: false,
		helpDialog: false,
		warningDialog: false,
		languageAnchor: null,
		currentOccupancyRate: OccupancyUpdater.getRate()
	}
	selectedDegrees: Degree[] = []
	tempSelectedDegrees: string[] = []
	hasPreviousDegrees = false

	// eslint-disable-next-line
	constructor(props: any) {
		super(props)
		this.onSelectedDegree = this.onSelectedDegree.bind(this)
		this.onSelectedCourse = this.onSelectedCourse.bind(this)
		this.onLanguageMenuClick = this.onLanguageMenuClick.bind(this)
		this.onChangeDarkMode = this.onChangeDarkMode.bind(this)
	}

	async componentDidMount(): Promise<void> {
		// Update term
		const currTermId = await defineCurrentTerm()
		this.onSelectedAcademicTerm(currTermId, false)

		const degrees = await API.getDegrees()
		this.setState({
			degrees: degrees ?? []
		})
		if (degrees === null) {
			this.props.showAlert(i18next.t('alert.cannot-obtain-degrees'), 'error')
		}
		if (this.tempSelectedDegrees.length > 0) {
			this.setSelectedDegrees(this.tempSelectedDegrees)
			this.tempSelectedDegrees = []
		}
	}

	async componentDidUpdate(prevProps: any): Promise<void> {
		if (prevProps.currentTimetable !== this.props.currentTimetable) {
			const degreeAcronyms = Array.from(this.props.currentTimetable.degreeAcronyms)
			this.setSelectedDegrees(degreeAcronyms)
			const courses = this.props.currentTimetable.courseUpdates
			this.setSelectedCourses(courses)
		}
	}
	// ----
	async onSelectedDegree(degrees: Degree[]): Promise<void> {
		this.selectedDegrees = degrees
		if (degrees.length > 0) {
			let degreeCourses: Course[] = []
			for (const degree of degrees) {
				const tempCourses = await API.getCourses(degree)
				if (tempCourses === null) {
					// TODO: Test when this cannot be obtained
					this.props.showAlert(i18next.t('alert.cannot-obtain-courses'), 'error')
					return
				}
				degreeCourses = degreeCourses.concat(tempCourses)
			}
			const selected = this.state.selectedCourses.courses
			const availableCourses = Comparables.toUnique(degreeCourses.concat(selected)) as Course[]

			if (this.hasPreviousDegrees) {
				// If degrees were loaded, update courses to have the right degree
				availableCourses.forEach((c) => c.updateDegree(this.selectedDegrees.map(d => d.acronym)))
				this.hasPreviousDegrees = false
			}
			this.setState({
				availableCourses: availableCourses.sort(Course.compare)
			})
		} else {
			this.setState({
				availableCourses: this.state.selectedCourses.courses
			})
		}
		this.props.onSelectedDegree(this.selectedDegrees)
	}

	setHasSelectedShifts(shifts: Shift[]): void {
		this.setState({
			hasSelectedShifts: shifts.length > 0
		})
	}

	//FIXME: Available courses not updating when a course from another degree is removed
	private async onSelectedCourse(selectedCourses: Course[]): Promise<void> {
		this.props.onSelectedCourse(selectedCourses)
	}

	setSelectedDegrees(selectedDegreesAcronyms: string[]): void {
		// Store temporarily the degrees for the degrees to be loaded
		if (this.state.degrees.length === 0) {
			this.hasPreviousDegrees = true
			this.tempSelectedDegrees = selectedDegreesAcronyms
		} else { // When degrees are loaded, select them
			this.selectedDegrees = this.state.degrees.filter( (d) => selectedDegreesAcronyms.includes(d.acronym))
			this.onSelectedDegree(this.selectedDegrees)
		}
	}

	setSelectedCourses(selectedCourses: CourseUpdates): void {
		// FIXME: Maybe not use toUnique?
		const availableCourses =
			Comparables.toUnique(this.state.availableCourses.concat(selectedCourses.courses)) as Course[]
		this.setState({
			selectedCourses,
			availableCourses
		})
	}

	async onSelectedAcademicTerm(s: string, fetchDegrees: boolean): Promise<void> {
		const foundArr = staticData.terms.filter( (at) => at.id === s)
		let chosenAT: AcademicTerm | undefined = undefined
		if (foundArr.length > 0) {
			chosenAT = foundArr[0]
			API.ACADEMIC_TERM = chosenAT.term
			API.SEMESTER = chosenAT.semester
		}

		this.onSelectedCourse([])
		this.onSelectedDegree([])
		this.props.onClearShifts(false)
		// Store in storage
		if (chosenAT) {
			const stateInstance = SavedStateHandler.getInstance()
			stateInstance.setTerm(chosenAT)
		}
		if (fetchDegrees) {
			const degrees = await API.getDegrees()
			this.setState({
				selectedAcademicTerm: s,
				degrees: degrees ?? []
			})
		} else {
			this.setState({ selectedAcademicTerm: s })
		}
	}

	onLanguageMenuClick(event: React.MouseEvent<HTMLSpanElement, MouseEvent> | null, open: boolean): void {
		if (open && event !== null) {
			this.setState({
				languageAnchor: event.currentTarget
			})
		} else {
			this.setState({
				languageAnchor: null
			})
		}
	}

	async onLanguageSelect(language: string): Promise<void> {
		this.onLanguageMenuClick(null, false)

		// The inner function will only run if the language changes
		await this.props.onChangeLanguage(language, async () => {
			// Get degrees with correct language and erase courses
			const degrees = await API.getDegrees()
			this.setState({
				degrees: degrees ?? []
			})
		})

		// this.selectedDegrees = []
		// this.onSelectedCourse([])
	}

	onChangeDarkMode(): void {
		this.props.onChangeDarkMode(!this.props.darkMode)
	}

	onOccupancyRateUpdate(newRate: number): void {
		OccupancyUpdater.getInstance().changeRate(newRate)
		this.setState({
			currentOccupancyRate: newRate
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
							value={this.selectedDegrees}
							color="inherit"
							size="small"
							className={styles.degreeSelector}
							multiple
							selectOnFocus
							clearOnBlur
							handleHomeEndKeys={false}
							onChange={(_, value) => this.onSelectedDegree(value)}
							noOptionsText={i18next.t('degree-selector.noOptions') as string}
							options={this.state.degrees}
							getOptionLabel={(option) => option.displayName()}
							renderInput={(params) => <TextField {...params} label={i18next.t('degree-selector.title') as string} variant="outlined" />}
							renderTags={(tagValue, getTagProps) => {
								// TODO: Fix chip color
								return tagValue.map((option, index) => (
									<Tooltip title={option.displayName()} key={option.hashString()}>
										<Chip {...getTagProps({ index })} size="small" color='secondary' label={option.acronym} />
									</Tooltip>
								))
							}}
						/>
						<Autocomplete
							value={this.state.selectedCourses.courses}
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
									this.state.selectedCourses.courses.length === maxSelectedCourses
							}}
							noOptionsText={i18next.t('course-selector.noOptions') as string}
							getOptionLabel={(option) => {
								// Make course show degree when multiple are chosen
								option.showDegree = this.selectedDegrees.length > 1
								return option.displayName()
							}}
							renderInput={(params) => <TextField  {...params} label={i18next.t('course-selector.title') as string} variant="outlined" />}
							renderTags={(tagValue, getTagProps) => {
								return tagValue.map((option, index) => (
									<Tooltip title={option.displayName()} key={option.hashString()}>
										<Chip {...getTagProps({ index })} size="small" color='primary'
											style={{backgroundColor: option.color}}
											label={<span style={{color: option.textColor}}>{option.acronym}</span>}
										/>
									</Tooltip>
								))
							}}
						/>
						<Tooltip title={i18next.t('language-button.tooltip') as string}>
							<IconButton color="inherit"
								onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {this.onLanguageMenuClick(e, true)}}
								component="span"
							>
								<Icon>language</Icon>
							</IconButton>
						</Tooltip>
						<Menu
							id="language-menu"
							anchorEl={this.state.languageAnchor}
							keepMounted
							open={Boolean(this.state.languageAnchor)}
							onClose={() => {this.onLanguageMenuClick(null, false)}}
						>
							<MenuItem onClick={() => {this.onLanguageSelect('pt')}}>
								<Tooltip open={false} title={i18next.t('language.portuguese') as string} placement='left-start'>
									<Avatar alt="Portuguese" src={`${process.env.PUBLIC_URL}/img/language/portugal.png`} />
								</Tooltip>
							</MenuItem>
							<MenuItem onClick={() => {this.onLanguageSelect('en')}}>
								<Tooltip open={false} title={i18next.t('language.english') as string} placement='left-start'>
									<Avatar alt="English" src={`${process.env.PUBLIC_URL}/img/language/united-kingdom.png`} />
								</Tooltip>
							</MenuItem>
						</Menu>
						<Tooltip title={i18next.t(this.props.darkMode ? 'darkmode-button.dark' : 'darkmode-button.light') as string}>
							<IconButton color="inherit" onClick={this.onChangeDarkMode} component="span">
								{ this.props.darkMode ? <Brightness5Icon/> : <Brightness2Icon/> }
							</IconButton>
						</Tooltip>
						<Tooltip title={i18next.t('help-button.tooltip') as string}>
							<IconButton disabled={this.state.helpDialog} color="inherit" onClick={() => {this.setState({helpDialog: true})}} component="span">
								<Icon>help</Icon>
							</IconButton>
						</Tooltip>
						<IconButton color='inherit' onClick={() => {this.setState({settingsDialog: true})}} component="span"
							style={{display: 'initial'}}>
							<Icon>settings</Icon>
						</IconButton>
					</Toolbar>
				</AppBar>
				<Dialog open={this.state.settingsDialog}
					onClose={() => {this.setState({ settingsDialog: false })}}
					fullWidth={true}
				>
					<DialogTitle>{i18next.t('settings-dialog.title')}
					</DialogTitle>
					<DialogContent>
						<FormControl variant='outlined'
							fullWidth={true}
						>
							<InputLabel>{i18next.t('settings-dialog.select.label') as string}</InputLabel>
							<Select
								id="semester"
								value={this.state.selectedAcademicTerm}
								onChange={(e) => {this.onSelectedAcademicTerm(e.target.value as string, true)}}
								label={i18next.t('settings-dialog.select.label') as string}
								// className={styles.semesterSelector}
								autoWidth={true}
							>
								{staticData.terms.map( (s) =>
									<MenuItem key={s.id} value={s.id}>{s.term} {s.semester}{i18next.t('settings-dialog.select.value', { count: s.semester }) as string}
									</MenuItem>
								)}
							</Select>
						</FormControl>
						<Typography variant="caption" gutterBottom style={{marginTop: '8px', fontWeight: 600}}>
							{i18next.t('settings-dialog.select.warning') as string}
						</Typography>
						<Divider orientation="horizontal" style={{ marginTop: '30px' }} />
						<div style={{display: 'none'}}>
							<Typography style={{margin: '10px 0'}}>This is not working, so do not try it :)</Typography>
							<FormControl variant='outlined'
								fullWidth={true}
							>
								<InputLabel>{i18next.t('settings-dialog.occupancy-update.label') as string}</InputLabel>
								<Select
									id="occupancy-update"
									value={this.state.currentOccupancyRate}
									// FIXME: Commented so it does not work until fully tested
									// onChange={(e) => {this.onOccupancyRateUpdate(e.target.value as number)}}
									label={i18next.t('settings-dialog.occupancy-update.label') as string}
									autoWidth={true}
								>
									{Object.entries(occupancyRates).map( (s) => 
										<MenuItem key={s[1]} value={s[1]}>{s[0]}</MenuItem>
									)}
								</Select>
							</FormControl>
							<Typography variant="caption" gutterBottom style={{marginTop: '8px'}}>
								{i18next.t('settings-dialog.occupancy-update.warning') as string}
							</Typography>
						</div>
					</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => {this.setState({settingsDialog: false})}} color="primary">
							{i18next.t('settings-dialog.actions.close-button') as string}
						</Button>
					</DialogActions>
				</Dialog>
				<Dialog open={this.state.helpDialog}
					onClose={() => {this.setState({helpDialog: false})}}
					maxWidth={'lg'}
					fullWidth={false}
				>
					<DialogContent style={{padding: 0}}>
						<video autoPlay loop style={{width: '100%'}}>
							<source src={`${process.env.PUBLIC_URL}/media/demo.m4v`} type="video/mp4"/>
						</video>
					</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => {this.setState({helpDialog: false})}} color="primary">
							{i18next.t('help-dialog.actions.close-button') as string}
						</Button>
					</DialogActions>
				</Dialog>
				<Dialog open={this.state.warningDialog}>
					<DialogTitle>{i18next.t('warning-dialog.title') as string}</DialogTitle>
					<DialogContent>{i18next.t('warning-dialog.content') as string}</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => {this.setState({warningDialog: false})}} color="primary">
							{i18next.t('warning-dialog.actions.close-button') as string}
						</Button>
					</DialogActions>
				</Dialog>
				<iframe id="txtArea1" style={{ display: 'none'}}></iframe>
			</div>
		)
	}
}

export default TopBar
