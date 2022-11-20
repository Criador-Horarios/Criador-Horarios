import React, { useEffect, useState } from 'react'
import i18next from 'i18next'
import styles from './ColorPicker.module.scss'
import Course, { CourseWithShiftTypes } from '../../domain/Course'
import Chip from '@material-ui/core/Chip'

import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import { HexColorPicker, HexColorInput } from 'react-colorful'
import Button from '@material-ui/core/Button'
import { Box } from '@material-ui/core'
import { getColor1, getColor2, getColor3 } from '../../utils/colors'
import Typography from '@material-ui/core/Typography'

interface ColorPickerProps {
	course: CourseWithShiftTypes | null;
	setCourseColor: (course: Course, color: string) => void;
	onClose: () => void;
}

function ColorPicker ({course, setCourseColor, onClose} : ColorPickerProps) : JSX.Element {
	const [currColor, setCurrColor] = useState(() => course ? course.color.backgroundColor : 'ffffff')
		
	useEffect(() => {
		if (course !== null) {
			setCurrColor(course.color.backgroundColor)
		}
	}, [course])
	
	const handleConfirm = () => {
		if (course === null) {
			return
		}

		setCourseColor(course.course, currColor)
		onClose()
	}

	const [color1, textColor1] = getColor1(currColor)
	const [color2, textColor2] = getColor2(currColor)
	const [color3, textColor3] = getColor3(currColor)

	return (
		<div>
			<Dialog open={!!course} fullWidth={true} maxWidth='xs'>
				<DialogTitle>{i18next.t('color-picker-dialog.title', { course: course?.course.getAcronym()})}</DialogTitle>
				<DialogContent className={styles.ColorPicker}>
					<Box display="flex" justifyContent="center" alignItems="center" flexDirection="column">
						<Typography>{i18next.t('color-picker-dialog.content.preview')}</Typography>
						<Box display="flex" justifyContent="center" alignItems="center" flexDirection="row">
							<Chip
								size="medium"
								className={styles.Chip}
								style={{backgroundColor: color1}}
								label={<span style={{color: textColor1}}>Teo</span>}
							/>
							<Chip
								size="medium"
								className={styles.Chip}
								style={{backgroundColor: color2}}
								label={<span style={{color: textColor2}}>PB</span>}
							/>
							<Chip
								size="medium"
								className={styles.Chip}
								style={{backgroundColor: color3}}
								label={<span style={{color: textColor3}}>L</span>}
							/>
						</Box>
						<HexColorPicker
							className={styles.ReactColorful}
							color={currColor}
							onChange={setCurrColor}
						/>
						<HexColorInput color={currColor} onChange={setCurrColor} />
					</Box>
				</DialogContent>
				<DialogActions>
					<Button color="default" onClick={onClose}>
						{i18next.t('color-picker-dialog.actions.cancel')}
					</Button>

					<Button color="primary" onClick={handleConfirm}>
						{i18next.t('color-picker-dialog.actions.save')}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	)
}

export default ColorPicker
