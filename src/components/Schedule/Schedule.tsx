import React, { useMemo } from 'react'
import Lesson, { addColorToLesson, LessonWithColor } from '../../domain/Lesson'
import styles from './Schedule.module.scss'
import FullCalendar, { EventClickArg, EventContentArg } from '@fullcalendar/react'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import timeGridPlugin from '@fullcalendar/timegrid'
import Tooltip from '@material-ui/core/Tooltip'
import Box from '@material-ui/core/Box/Box'
import { ShiftOccupation } from '../../domain/Shift'
import i18next from 'i18next'
// import './_materialFullCalendar.scss'

import { useAppState } from '../../hooks/useAppState'
import Course, { CourseColor } from '../../domain/Course'

interface ScheduleProps {
	onSelectedEvent: (id: string) => void;
	getCourseColor: (course: Course) => CourseColor;
	events: Lesson[];
}

function Schedule ({onSelectedEvent, getCourseColor, events} : ScheduleProps) : JSX.Element {
	const { lang } = useAppState()
	
	const lessonsWithColors: LessonWithColor[] = useMemo(() => {
		return events.map(lesson => addColorToLesson(lesson, getCourseColor(lesson.course)))
	}, [events, getCourseColor])

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

	return (
		<div className={styles.Schedule}>
			<FullCalendar
				plugins={[ timeGridPlugin, bootstrapPlugin ]}
				initialView="timeGridWeek"
				allDaySlot={false}
				weekends={false}
				headerToolbar={false}
				nowIndicator={false}
				dayHeaderFormat={{
					month: undefined,
					year: undefined,
					day: undefined,
					weekday: 'long'
				}}
				slotMinTime={'08:00:00'}
				slotMaxTime={'20:00:00'}
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
				timeZone='Europe/Lisbon'
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

function EventContent({event} : EventContentArg): JSX.Element {
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
