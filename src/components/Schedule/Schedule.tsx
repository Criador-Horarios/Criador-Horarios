import React from 'react'
import Lesson from '../../domain/Lesson'
import styles from './Schedule.module.scss'
import FullCalendar, { EventClickArg, EventContentArg } from '@fullcalendar/react'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import timeGridPlugin from '@fullcalendar/timegrid'
import Tooltip from '@material-ui/core/Tooltip'
import Box from '@material-ui/core/Box/Box'
import { ShiftOccupation } from '../../domain/Shift'
import i18next from 'i18next'
import { isOkWithWhite } from '../../utils/colors'
import hexRgb from 'hex-rgb'
// import './_materialFullCalendar.scss'

import { useAppState } from '../../hooks/useAppState'

interface ScheduleProps {
	onSelectedEvent: (id: string) => void;
	events: Lesson[];
}

function Schedule ({onSelectedEvent, events} : ScheduleProps) : JSX.Element {
	const { lang } = useAppState()

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
				events={events}
				eventClick={onEventClick}
				eventContent={EventContent}
				locale={lang}
				themeSystem={'default'}
				stickyHeaderDates={false}
			/>
		</div>
	)
}

function EventContent({event , backgroundColor} : EventContentArg): JSX.Element {
	const occupation = Object.values(event.extendedProps.occupation as ShiftOccupation)
	const percentage = occupation[0]/occupation[1] * 100 || 0
	const textColor = isOkWithWhite(hexRgb(backgroundColor)) ? 'white' : 'black'

	return (
		<Tooltip arrow title={
			<React.Fragment>{i18next.t('schedule.shift.occupation')}: {occupation.join('/')} ({percentage.toFixed(0)}%)</React.Fragment>
		} placement={'top'}>
			<Box style={{maxWidth: '100%', height: '100%', color: textColor, wordBreak: 'break-word', overflowY: 'hidden'}}>
				<p style={{margin: '0'}}>{event.title}</p>
				<p style={{margin: '0'}}>{event.extendedProps.campus}</p>
			</Box>
		</Tooltip>
	)
}

export default Schedule
