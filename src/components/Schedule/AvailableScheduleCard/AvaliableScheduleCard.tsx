import React, { useMemo, useState } from 'react'

import i18next from 'i18next'
import styles from '../Schedule.module.scss'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import CardHeader from '@mui/material/CardHeader'

import Schedule from '../Schedule'
import ScheduleFilters from './ScheduleFilters'

import campiList from '../../../domain/CampiList'
import Shift, { ShiftType } from '../../../domain/Shift'
import Course, { CourseColor } from '../../../domain/Course'

interface AvaliableScheduleCardProps {
	availableShifts: Shift[];
	getCourseColor: (course: Course) => CourseColor;
	onSelectedShift: (shiftName: string, arr: Shift[]) => void;
}

function AvaliableScheduleCard ({availableShifts, getCourseColor, onSelectedShift} : AvaliableScheduleCardProps) : React.ReactElement {
	const [selectedCampi, setSelectedCampi] = useState([...campiList])
	const [selectedShiftTypes, setSelectedShiftTypes] = useState(Object.values(ShiftType) as string[])
	
	// Filter lessons according to current campi and shift type filters
	const shownLessons = useMemo(() => {
		return availableShifts.filter((s) => {
			const campi = selectedCampi.includes(s.getCampus()) || s.getCampus() === undefined
			const type = selectedShiftTypes.includes(s.getType())
			return campi && type
		})
			.map((shift) => shift.getLessons())
			.flat()
	}, [availableShifts, selectedCampi, selectedShiftTypes])

	return (
		<Card className={styles.ScheduleCard}>
			<CardHeader title={i18next.t('schedule-available.title') as string}
				titleTypographyProps={{ variant: 'h6', align: 'center' }}
				className={styles.ScheduleCardTitle}
			/>
			<CardContent className={styles.ScheduleCardContent}>
				<Schedule
					onSelectedEvent={(id: string) => onSelectedShift(id, availableShifts)}
					getCourseColor={getCourseColor}
					events={shownLessons}
				/>
			</CardContent>
			<CardActions>
				<ScheduleFilters
					selectedCampi={selectedCampi}
					setSelectedCampi={setSelectedCampi}
					selectedShiftTypes={selectedShiftTypes}
					setSelectedShiftTypes={setSelectedShiftTypes}
				/>
			</CardActions>
		</Card>
	)
}

export default AvaliableScheduleCard
