import React, { useMemo, useState } from 'react'

import i18next from 'i18next'
import styles from './Schedule.module.scss'

import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import Paper from '@material-ui/core/Paper'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import Divider from '@material-ui/core/Divider'
import CardHeader from '@material-ui/core/CardHeader'

import { useTheme, withStyles } from '@material-ui/core/styles'

import Schedule from './Schedule'

import campiList from '../../domain/CampiList'
import Shift, { ShiftType } from '../../domain/Shift'
import Timetable from '../../domain/Timetable'

interface AvaliableScheduleCardProps {
	savedTimetable: Timetable;
	onSelectedShift: (shiftName: string, arr: Shift[]) => void;
}

const StyledToggleButtonGroup = withStyles((theme) => ({
	grouped: {
		margin: theme.spacing(0.5),
		border: 'none',
		'&:not(:first-child)': {
			borderRadius: theme.shape.borderRadius,
		},
		'&:first-child': {
			borderRadius: theme.shape.borderRadius,
		},
	}
}))(ToggleButtonGroup)


function AvaliableScheduleCard ({savedTimetable, onSelectedShift} : AvaliableScheduleCardProps) : JSX.Element {
	const theme = useTheme()
	
	const [selectedCampi, setSelectedCampi] = useState([...campiList])
	const [selectedShiftTypes, setSelectedShiftTypes] = useState(Object.values(ShiftType) as string[])
	
	const { availableShifts } = savedTimetable.shiftState

	// Filter lessons according to current campi and shift type filters
	const shownLessons = useMemo(() => {
		return availableShifts.filter((s) => {
			const campi = selectedCampi.includes(s.campus) || s.campus === undefined
			const type = selectedShiftTypes.includes(s.type)
			return campi && type
		})
			.map((shift) => shift.lessons)
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
					onSelectedEvent={(id: string) => onSelectedShift(id, savedTimetable.shiftState.availableShifts)}
					events={shownLessons}
					lang="pt-PT" // FIXME
					darkMode={true} // FIXME
				/>
			</CardContent>
			<CardActions>
				<Paper elevation={0} className={`${styles.SchedulePaper} ${styles.ScheduleCentered}`}
					style={{ border: `1px solid ${theme.palette.divider}` }}
				>
					<StyledToggleButtonGroup
						className={styles.ScheduleToggleGroup}
						size="small"
						value={selectedCampi}
						onChange={(_, value) => setSelectedCampi(value as string[])}
						aria-label="text alignment"
					>
						{campiList.map((name: string) => (
							<ToggleButton key={name} value={name}>{name}</ToggleButton>
						))}
					</StyledToggleButtonGroup>
					<Divider flexItem orientation="vertical" style={{margin: theme.spacing(1, 0.5)}}/>
					<StyledToggleButtonGroup
						className={styles.ScheduleToggleGroup}
						size="small"
						value={selectedShiftTypes}
						onChange={(_, value) => setSelectedShiftTypes(value as string[])}
					>
						{Object.entries(ShiftType).map((name) => (
							<ToggleButton key={name[1]} value={name[1]}>{name[0]}</ToggleButton>
						))}
					</StyledToggleButtonGroup>
				</Paper>
			</CardActions>
		</Card>
	)
}

export default AvaliableScheduleCard