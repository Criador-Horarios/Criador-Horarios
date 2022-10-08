import React from 'react'

import styles from '../Schedule.module.scss'

import Paper from '@material-ui/core/Paper'
import ToggleButton from '@material-ui/lab/ToggleButton'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import Divider from '@material-ui/core/Divider'

import { useTheme, withStyles } from '@material-ui/core/styles'

import campiList from '../../../domain/CampiList'
import { ShiftType } from '../../../domain/Shift'

interface ScheduleFiltersProps {
	selectedCampi: string[];
	setSelectedCampi: (campi: string[]) => void;
	selectedShiftTypes: string[];
	setSelectedShiftTypes: (campi: string[]) => void;
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



function ScheduleFilters ({
	selectedCampi,
	setSelectedCampi,
	selectedShiftTypes,
	setSelectedShiftTypes
} : ScheduleFiltersProps) : JSX.Element {
	const theme = useTheme()
	
	return (
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
	)
}

export default ScheduleFilters