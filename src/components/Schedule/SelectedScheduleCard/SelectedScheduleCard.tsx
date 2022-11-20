import React, { useMemo } from 'react'

import i18next from 'i18next'
import styles from '../Schedule.module.scss'

import Box from '@material-ui/core/Box'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Typography from '@material-ui/core/Typography'

import Schedule from '../Schedule'
import ScheduleActions from './ScheduleActions'
import SelectedCourses from './SelectedCourses'
import TimetableSelector from './TimetableSelector'

import Course, { CourseColor } from '../../../domain/Course'
import Shift from '../../../domain/Shift'
import Timetable from '../../../domain/Timetable'

interface SelectedScheduleCardProps {
	activeTimetable: Timetable;
	availableTimetables: (Timetable | string)[];
	onSelectedTimetable: (timetable: Timetable | string) => void;
	onSelectedShift: (shiftName: string, arr: Shift[]) => void;
	deleteTimetable: (timetable: Timetable) => void;
	onChangeMultiShiftMode: (event: React.ChangeEvent<HTMLInputElement>, value: boolean) => void;
	getCourseColor: (course: Course) => CourseColor;
	onChangeCourseColor: (course: Course, color: string) => void;
	openDuplicateTimetable: (timetable: Timetable) => void;
}

function SelectedScheduleCard ({
	activeTimetable,
	availableTimetables,
	onSelectedTimetable,
	onSelectedShift,
	deleteTimetable,
	onChangeMultiShiftMode,
	getCourseColor,
	onChangeCourseColor,
	openDuplicateTimetable,
} : SelectedScheduleCardProps) : JSX.Element {
	const selectedShifts = activeTimetable.getSelectedShifts()

	const selectedLessons = useMemo(() => {
		return selectedShifts.map((shift: Shift) => shift.getLessons()).flat()
	}, [selectedShifts])
	
	const coursesBySelectedShifts = useMemo(() => {
		const coursesWithTypes = activeTimetable.getCoursesWithShiftTypes()
			.filter(({shiftTypes}) => Object.values(shiftTypes).some(Boolean)) // only include courses with selected shifts
		return coursesWithTypes.sort(({course: courseA}, {course: courseB}) => Course.compare(courseA, courseB))
	}, [selectedShifts, getCourseColor])

	return (
		<Card className={styles.ScheduleCard as string}>
			<CardHeader //title={i18next.t('schedule-selected.title') as string}
				titleTypographyProps={{ variant: 'h6', align: 'center' }}
				className={styles.ScheduleCardTitle as string}
				title={
					<Box style={{flexDirection: 'row', display: 'flex'}}>
						<span style={{flexGrow: 1, width: '23%'}}></span>
						<Typography variant='h6' align='center' style={{flexGrow: 1}}>{i18next.t('schedule-selected.title')}</Typography>
						<TimetableSelector
							activeTimetable={activeTimetable}
							availableTimetables={availableTimetables}
							onSelectedTimetable={onSelectedTimetable}
							deleteTimetable={deleteTimetable}
						/>
					</Box>
				}
			/>
			<CardContent className={styles.ScheduleCardContent as string}>
				<Schedule
					onSelectedEvent={(id: string) => onSelectedShift(id, selectedShifts)}
					getCourseColor={getCourseColor}
					events={selectedLessons}
				/>
			</CardContent>
			<CardActions>
				<SelectedCourses coursesBySelectedShifts={coursesBySelectedShifts} setCourseColor={onChangeCourseColor} />
				<ScheduleActions
					activeTimetable={activeTimetable}
					onChangeMultiShiftMode={onChangeMultiShiftMode}
					openDuplicateTimetable={openDuplicateTimetable}
				/>
			</CardActions>
		</Card>
	)
}

export default SelectedScheduleCard
