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

import Course from '../../../domain/Course'
import Shift, { ShiftType } from '../../../domain/Shift'
import Timetable from '../../../domain/Timetable'

import API from '../../../utils/api'
import TimetableSelector from './TimetableSelector'

interface SelectedScheduleCardProps {
	savedTimetable: Timetable;
	shownTimetables: (Timetable | string)[];
	onSelectedTimetable: (timetable: Timetable | string) => void;
	onSelectedShift: (shiftName: string, arr: Shift[]) => void;
	onChangeMultiShiftMode(event: React.ChangeEvent<HTMLInputElement>, value: boolean): void;
}

function SelectedScheduleCard ({
	savedTimetable,
	shownTimetables,
	onSelectedTimetable,
	onSelectedShift,
	onChangeMultiShiftMode
} : SelectedScheduleCardProps) : JSX.Element {
	const { selectedShifts } = savedTimetable.shiftState

	const selectedLessons = useMemo(() => {
		return selectedShifts.map((shift: Shift) => shift.lessons).flat()
	}, [selectedShifts])
	
	const coursesBySelectedShifts = useMemo(() => {
		const coursesShifts = savedTimetable.getCoursesWithShiftTypes()
		const coursesWithTypes: [Course, Record<ShiftType, boolean | undefined>][] = Object.entries(coursesShifts)
			.map(([courseId, types]) =>
				[API.REQUEST_CACHE.getCourse(courseId, savedTimetable.getAcademicTerm()), types] as [Course, Record<ShiftType, boolean>]
			).filter(([course]) => course !== undefined)

		return coursesWithTypes.sort(([courseA], [courseB]) => Course.compare(courseA, courseB))
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
							savedTimetable={savedTimetable}
							shownTimetables={shownTimetables}
							onSelectedTimetable={onSelectedTimetable}
						/>
					</Box>
				}
			/>
			<CardContent className={styles.ScheduleCardContent as string}>
				<Schedule
					onSelectedEvent={(id: string) => onSelectedShift(id, savedTimetable.shiftState.selectedShifts)}
					events={selectedLessons}
					lang="pt-PT" // FIXME
					darkMode={true} // FIXME
				/>
			</CardContent>
			<CardActions>
				<SelectedCourses coursesBySelectedShifts={coursesBySelectedShifts} />
				<ScheduleActions savedTimetable={savedTimetable} onChangeMultiShiftMode={onChangeMultiShiftMode} />
			</CardActions>
		</Card>
	)
}

export default SelectedScheduleCard