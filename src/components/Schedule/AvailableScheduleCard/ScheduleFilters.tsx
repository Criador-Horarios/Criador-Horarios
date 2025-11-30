import React from 'react'

import styles from '../Schedule.module.scss'

import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'

import { useTheme } from '@mui/material/styles'

import campiList from '../../../domain/CampiList'
import { ShiftType } from '../../../domain/Shift'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

interface ScheduleFiltersProps {
	selectedCampi: string[];
	setSelectedCampi: (campi: string[]) => void;
	selectedShiftTypes: string[];
	setSelectedShiftTypes: (campi: string[]) => void;
}



function ScheduleFilters ({
	selectedCampi,
	setSelectedCampi,
	selectedShiftTypes,
	setSelectedShiftTypes
} : ScheduleFiltersProps) : React.ReactElement {
	const theme = useTheme()

	const buttonFilterStyle = {
		margin: theme.spacing(0.5),
		border: 'none',
	}
	
	return (
		<Paper elevation={0} className={`${styles.SchedulePaper} ${styles.ScheduleCentered}`}
			style={{ border: `1px solid ${theme.palette.divider}` }}
		>
			{/* TODO: Recover original styles! */}
			<ToggleButtonGroup
				className={styles.ScheduleToggleGroup}
				size="small"
				value={selectedCampi}
				onChange={(_, value) => setSelectedCampi(value as string[])}
				aria-label="text alignment"
			>
				{campiList.map((name: string) => (
					<ToggleButton key={name} value={name} sx={buttonFilterStyle}>{name}</ToggleButton>
				))}
			</ToggleButtonGroup>
			<Divider flexItem orientation="vertical" sx={{margin: theme.spacing(1, 0.5)}}/>
			<ToggleButtonGroup
				className={styles.ScheduleToggleGroup}
				size="small"
				value={selectedShiftTypes}
				onChange={(_, value) => setSelectedShiftTypes(value as string[])}
			>
				{Object.entries(ShiftType).map((name) => (
					<ToggleButton key={name[1]} value={name[1]} sx={buttonFilterStyle}>
						{name[0]}
					</ToggleButton>
				))}
			</ToggleButtonGroup>
		</Paper>
	)
}

export default ScheduleFilters
