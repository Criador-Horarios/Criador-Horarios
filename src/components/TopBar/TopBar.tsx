import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './TopBar.module.scss'

import API, { staticData } from '../../utils/api'
import { Comparables } from '../../domain/Comparable'
import Degree from '../../domain/Degree'
import Course, { CourseColor } from '../../domain/Course'

import Chip from '@material-ui/core/Chip'
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete'
import TextField from '@material-ui/core/TextField'
import Toolbar from '@material-ui/core/Toolbar'
import Tooltip from '@material-ui/core/Tooltip'
import AppBar from '@material-ui/core/AppBar'

import i18next from 'i18next'
import AcademicTerm from '../../domain/AcademicTerm'
import HelpButton from './HelpButton'
import LanguageButton from './LanguageButton'
import DarkModeButton from './DarkModeButton'
import SettingsButton from './SettingsButton'
import { useAlert } from '../../hooks/useAlert'

interface TopBarProps {
	selectedCourses: Course[];
	onSelectedCourse: (selectedCourses: Course[]) => Promise<void>;
	selectedDegrees: string[]; // degree acronyms
	setSelectedDegrees: (selectedDegrees: string[]) => Promise<void>;
	selectedAcademicTerm: string | null,
	onChangeAcademicTerm: (newAcademicTerm: AcademicTerm) => void;
	getCourseColor: (course: Course) => CourseColor;
}

function TopBar ({
	selectedCourses,
	onSelectedCourse,
	selectedDegrees,
	setSelectedDegrees,
	selectedAcademicTerm,
	onChangeAcademicTerm,
	getCourseColor,
} : TopBarProps) : JSX.Element {
	const dispatchAlert = useAlert()

	const [availableDegrees, setAvailableDegrees] = useState<Degree[]>([])
	const [availableCourses, setAvailableCourses] = useState<Course[]>([])
	
	const currentDegrees = useMemo(() => {
		return availableDegrees.filter((degree: Degree) => selectedDegrees.includes(degree.acronym))
	}, [availableDegrees, selectedDegrees])
	
	const refreshAvailableDegrees = useCallback(async () => {
		const degrees = await API.getDegrees(selectedAcademicTerm ?? undefined)
		
		setAvailableDegrees(degrees ?? [])
		if (degrees === null) {
			dispatchAlert({ message: i18next.t('alert.cannot-obtain-degrees'), severity: 'error' })
		}
	}, [])
	
	const refreshAvailableCourses = async () => {
		if (currentDegrees.length > 0) {
			let degreeCourses: Course[] = []
			for (const degree of currentDegrees) {
				const tempCourses = await API.getCourses(degree, selectedAcademicTerm ?? undefined)
				if (tempCourses === null) {
					// TODO: Test when this cannot be obtained
					dispatchAlert({ message: i18next.t('alert.cannot-obtain-courses'), severity: 'error' })
					return
				}
				degreeCourses = degreeCourses.concat(tempCourses)
			}
			const selected = selectedCourses
			const availableCourses = Comparables.toUnique(degreeCourses.concat(selected)) as Course[]

			setAvailableCourses(availableCourses)
		} else {
			setAvailableCourses(selectedCourses)
		}
	}
	
	useEffect(() => {
		// If we make the outer function async, it will no longer return void
		// This might cause unexpected behaviour, since React calls the return of this function on unmount
		(async () => {
			await refreshAvailableDegrees()
		})()
	}, [])
	
	useEffect(() => {
		(async () => {
			await refreshAvailableCourses()
		})()
	}, [currentDegrees, availableDegrees, selectedAcademicTerm])

	const handleSelectDegrees = (degrees: Degree[]) => {
		setSelectedDegrees(degrees.map((degree: Degree) => degree.acronym))
	}

	const onSelectedAcademicTerm = (academicTermId: string) => {
		const foundTerm = staticData.terms.find((at) => at.id === academicTermId)
		if (foundTerm !== undefined) {
			onChangeAcademicTerm(foundTerm)
		}
	}

	const maxTags = 14
	const courseFilterOptions = createFilterOptions({
		stringify: (option: Course) => option.searchableName(selectedDegrees.length > 1)
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
						value={currentDegrees}
						color="inherit"
						size="small"
						className={styles.degreeSelector}
						multiple
						selectOnFocus
						clearOnBlur
						handleHomeEndKeys={false}
						onChange={(_, value) => handleSelectDegrees(value)}
						noOptionsText={i18next.t('degree-selector.noOptions') as string}
						options={availableDegrees}
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
						value={selectedCourses}
						color="inherit"
						size="small"
						className={styles.courseSelector}
						multiple
						selectOnFocus
						clearOnBlur
						disableCloseOnSelect
						handleHomeEndKeys={false}
						limitTags={maxTags}
						onChange={(_, courses: Course[]) => onSelectedCourse(courses)}
						filterOptions={courseFilterOptions}
						options={availableCourses}
						getOptionDisabled={(option) => {
							return selectedCourses.length === maxSelectedCourses && !selectedCourses.includes(option)
						}}
						noOptionsText={i18next.t('course-selector.noOptions') as string}
						getOptionLabel={(option) => {
							// Make course show degree when multiple are chosen
							return option.displayName(selectedDegrees.length > 1)
						}}
						renderInput={(params) => <TextField {...params} label={i18next.t('course-selector.title') as string} variant="outlined" />}
						renderTags={(tagValue, getTagProps) => {
							return tagValue.map((option, index) => {
								const {backgroundColor, textColor} = getCourseColor(option)
								return (
									<Tooltip title={option.displayName(selectedDegrees.length > 1)} key={option.hashString()}>
										<Chip {...getTagProps({ index })} size="small" color='secondary'
											style={{backgroundColor}}
											label={<span style={{color: textColor}}>{option.getAcronym()}</span>}
										/>
									</Tooltip>
								)
							})
						}}
					/>
					<LanguageButton refreshAvailableDegrees={refreshAvailableDegrees} />
					<DarkModeButton />
					<HelpButton />
					<SettingsButton selectedAcademicTerm={selectedAcademicTerm} onSelectedAcademicTerm={onSelectedAcademicTerm} />
				</Toolbar>
			</AppBar>
		</div>
	)
}

export default TopBar
