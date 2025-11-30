import React, { useMemo } from 'react'
import Lesson, { addColorToLesson, changeTimezone, LessonWithColor } from '../../domain/Lesson'
import styles from './Schedule.module.scss'
import FullCalendar from '@fullcalendar/react'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import timeGridPlugin from '@fullcalendar/timegrid'
import Tooltip from '@mui/material/Tooltip'
import { ShiftOccupation } from '../../domain/Shift'
import i18next from 'i18next'
// import './_materialFullCalendar.scss'

import { useAppState } from '../../hooks/useAppState'
import Course, { CourseColor } from '../../domain/Course'
import Box from '@mui/material/Box'
import { EventClickArg, EventContentArg } from '@fullcalendar/core'

interface ScheduleProps {
	onSelectedEvent: (id: string) => void;
	getCourseColor: (course: Course) => CourseColor;
	events: Lesson[];
}

function Schedule ({onSelectedEvent, getCourseColor, events} : ScheduleProps) : React.ReactElement {
	const { lang, timezone, showAllHours } = useAppState()
	
	const lessonsWithColors: LessonWithColor[] = useMemo(() => {
		return events.map(lesson => addColorToLesson(changeTimezone(lesson, timezone), getCourseColor(lesson.course)))
	}, [events, getCourseColor, timezone])

	const onEventClick = (info: EventClickArg) => {
		// TODO: The courses don't have url for now
		// const withCtrl = info.jsEvent.ctrlKey
		// if (withCtrl) {
		// 	const url = info.event.extendedProps.courseUrl
		// 	const win = window.open(url)
		// 	win?.focus()
		// } else {
		// 	this.props.onSelectedEvent(info.event.id)
		// }
		onSelectedEvent(info.event.id)
	}

	let minTime = '08:00:00'
	let maxTime = '20:00:00'
	let showWeekend = false
	if (timezone !== 'Europe/Lisbon' && !!timezone) {
		minTime = '00:00:00'
		maxTime = '24:00:00'
		showWeekend = true
	}

	if (showAllHours) {
		minTime = '00:00:00'
		maxTime = '24:00:00'
	}

	return (
		<div className={styles.Schedule}>
			<FullCalendar
				plugins={[ timeGridPlugin, bootstrapPlugin ]}
				initialView="timeGridWeek"
				allDaySlot={false}
				weekends={showWeekend}
				headerToolbar={false}
				nowIndicator={false}
				dayHeaderFormat={{
					month: undefined,
					year: undefined,
					day: undefined,
					weekday: 'long'
				}}
				slotMinTime={minTime}
				slotMaxTime={maxTime}
				slotLabelFormat={{
					hour: '2-digit',
					minute: '2-digit',
					omitZeroMinute: false,
					meridiem: undefined,
					hour12: false
				}}
				slotEventOverlap={false}
				eventTimeFormat={{
					hour: '2-digit',
					minute: '2-digit',
					omitZeroMinute: false,
					meridiem: undefined,
					hour12: false
				}}
				expandRows={false}
				height={'auto'}
				contentHeight={'auto'}
				timeZone={timezone}
				events={lessonsWithColors}
				eventClick={onEventClick}
				eventContent={EventContent}
				locale={lang}
				themeSystem={'default'}
				stickyHeaderDates={false}
			/>
		</div>
	)
}

function EventContent({event} : EventContentArg): React.ReactElement {
	const occupation = Object.values(event.extendedProps.occupation as ShiftOccupation)
	const percentage = occupation[0]/occupation[1] * 100 || 0

	return (
		<Tooltip arrow title={
			<React.Fragment>{i18next.t('schedule.shift.occupation')}: {occupation.join('/')} ({percentage.toFixed(0)}%)</React.Fragment>
		} placement={'top'}>
			<Box style={{maxWidth: '100%', height: '100%', wordBreak: 'break-word', overflowY: 'hidden'}}>
				<p style={{margin: '0'}}>{event.title}</p>
				<p style={{margin: '0'}}>{event.extendedProps.campus}</p>
			</Box>
		</Tooltip>
	)
}

export default Schedule
