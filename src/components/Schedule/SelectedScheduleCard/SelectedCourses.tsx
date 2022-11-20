import React, { useState } from 'react'

import i18next from 'i18next'
import styles from '../Schedule.module.scss'

import Chip from '@material-ui/core/Chip'
import Paper from '@material-ui/core/Paper'
import Tooltip from '@material-ui/core/Tooltip'
import Typography from '@material-ui/core/Typography'

import Course, { CourseWithShiftTypes } from '../../../domain/Course'
import { useTheme } from '@material-ui/core/styles'
import ColorPicker from '../../ColorPicker/ColorPicker'

interface SelectedCoursesProps {
	coursesBySelectedShifts: CourseWithShiftTypes[]
	setCourseColor: (course: Course, color: string) => void
}

function SelectedCourses ({ coursesBySelectedShifts, setCourseColor } : SelectedCoursesProps) : JSX.Element {
	const theme = useTheme()

	const [coursePickingColor, setCoursePickingColor] = useState<CourseWithShiftTypes | null>(null)
	
	return (
		<>
			<div style={{display: 'flex', flexGrow: 1, flexWrap: 'wrap'}}>
				{coursesBySelectedShifts.map((course) => {
					const {course: c, color, shiftTypes} = course
					const {backgroundColor, textColor} = color
					return (
						<Paper elevation={0} variant={'outlined'} key={c.hashString()}
							style={{padding: '4px', margin: '4px', display: 'flex'}}
						>
							<Tooltip title={i18next.t('color-picker-dialog.title', { course: c.getAcronym() }) as string}
								key={c.hashString()}>
								<Chip size="small" color='primary'
									style={{backgroundColor}}
									label={<span style={{color: textColor}}>{c.getAcronym()}</span>}
									onClick={() => setCoursePickingColor(course)} // Toggle colorPicker on click
								/>
							</Tooltip>
							{ Object.entries(shiftTypes).map(([type, shown]) => {
								return (
									<Paper elevation={0} key={type}
										className={ (shown ? styles.ShiftChecklistSelected : styles.ShiftChecklistUnselected) as string }
										style={{
											marginLeft: '4px', marginRight: '4px',
											color: `${shown ? theme.palette.text.primary : theme.palette.text.hint}` // TODO use MUI useStyle
										}}
									>
										<Typography variant='body1' style={{ fontWeight: 500 }}>{type}</Typography>
									</Paper>
								)
							}) }
						</Paper>
					)
				})}
			</div>
			<ColorPicker
				course={coursePickingColor}
				setCourseColor={setCourseColor}
				onClose={() => setCoursePickingColor(null)}
			/>
		</>
	)
}

export default SelectedCourses