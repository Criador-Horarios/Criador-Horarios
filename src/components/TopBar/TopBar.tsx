import React from 'react'
import styles from './TopBar.module.scss'

import API from '../../utils/api'
import Degree from '../../domain/Degree'
import Course from '../../domain/Course'

import Chip from '@material-ui/core/Chip'
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete'
import TextField from '@material-ui/core/TextField'
import Toolbar from '@material-ui/core/Toolbar'
import Tooltip from '@material-ui/core/Tooltip'
import AppBar from '@material-ui/core/AppBar'
import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/IconButton'
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles'

class TopBar extends React.PureComponent <{
  onSelectedDegree: (degree: Degree | null) => Promise<void>
  onSelectedCourse: (courses: Course[]) => Promise<void>
  onClearShifts: () => void
  onGetLink: () => void
  classes: CreateCSSProperties
}, unknown>{
	state = {
		filtersVisible: false,
		degrees: [] as Degree[],
		availableCourses: [] as Course[],
	}

	// eslint-disable-next-line
	constructor(props: any) {
		super(props)
		this.changeFiltersVisibility = this.changeFiltersVisibility.bind(this)
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

	changeFiltersVisibility(): void {
		this.setState({
			filtersVisible: !this.state.filtersVisible
		})
	}

	render(): React.ReactNode {
		const classes = this.props.classes

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
							className="selector course-selector"
							selectOnFocus
							clearOnBlur
							handleHomeEndKeys={false}
							onChange={(_, value) => this.props.onSelectedDegree(value)}
							noOptionsText="Sem opções"
							options={this.state.degrees}
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
							onChange={(_, courses: Course[]) => this.props.onSelectedCourse(courses)}
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
						<Tooltip title="Limpar horário">
							<IconButton color="inherit" onClick={this.props.onClearShifts} component="span">
								<Icon>delete</Icon>
							</IconButton>
						</Tooltip>
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
