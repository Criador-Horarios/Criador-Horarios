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

import Course from '../../../domain/Course'
import Shift from '../../../domain/Shift'
import Timetable from '../../../domain/Timetable'

interface SelectedScheduleCardProps {
	activeTimetable: Timetable;
	availableTimetables: (Timetable | string)[]; // TODO consider renaming to "availableTimetables" like on App.tsx
	onSelectedTimetable: (timetable: Timetable | string) => void;
	onSelectedShift: (shiftName: string, arr: Shift[]) => void;
	deleteTimetable: (timetable: Timetable) => void;
	onChangeMultiShiftMode: (event: React.ChangeEvent<HTMLInputElement>, value: boolean) => void;
}

function SelectedScheduleCard ({
	activeTimetable,
	availableTimetables,
	onSelectedTimetable,
	onSelectedShift,
	deleteTimetable,
	onChangeMultiShiftMode,
} : SelectedScheduleCardProps) : JSX.Element {
	const selectedShifts = activeTimetable.getSelectedShifts()

	const selectedLessons = useMemo(() => {
		return selectedShifts.map((shift: Shift) => shift.getLessons()).flat()
	}, [selectedShifts])
	
	const coursesBySelectedShifts = useMemo(() => {
		const coursesWithTypes = activeTimetable.getCoursesWithShiftTypes()
			.filter(({shiftTypes}) => Object.values(shiftTypes).some(Boolean)) // only include courses with selected shifts
		return coursesWithTypes.sort(({course: courseA}, {course: courseB}) => Course.compare(courseA, courseB))
	}, [selectedShifts])

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
					events={selectedLessons}
				/>
			</CardContent>
			<CardActions>
				<SelectedCourses coursesBySelectedShifts={coursesBySelectedShifts} />
				<ScheduleActions activeTimetable={activeTimetable} onChangeMultiShiftMode={onChangeMultiShiftMode} />
			</CardActions>
		</Card>
	)
}

export default SelectedScheduleCard