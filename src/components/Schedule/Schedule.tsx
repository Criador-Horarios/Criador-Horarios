import React from 'react'
import Lesson from '../../domain/Lesson'
import styles from './Schedule.module.scss'
import FullCalendar, { EventApi, EventClickArg } from '@fullcalendar/react'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import timeGridPlugin from '@fullcalendar/timegrid'
import Tooltip from '@material-ui/core/Tooltip'
import Box from '@material-ui/core/Box/Box'
import { ShiftOccupation } from '../../domain/Shift'
import i18next from 'i18next'
import { isOkWithWhite } from '../../utils/colors'
import hexRgb from 'hex-rgb'
// import './_materialFullCalendar.scss'

class Schedule extends React.PureComponent <{
	onSelectedEvent: (id: string) => void
	events: Lesson[]
	lang: string // TODO use hook instead
	darkMode: boolean // TODO use hook instead
}, unknown>{
	renderEventContent(eventInfo: {event: EventApi, backgroundColor: string}): JSX.Element {
		const occupation = Object.values(eventInfo.event.extendedProps.occupation as ShiftOccupation)
		const percentage = occupation[0]/occupation[1] * 100 || 0
		const textColor = isOkWithWhite(hexRgb(eventInfo.backgroundColor)) ? 'white' : 'black'

		return (
			<Tooltip arrow title={
				<React.Fragment>{i18next.t('schedule.shift.occupation')}: {occupation.join('/')} ({percentage.toFixed(0)}%)</React.Fragment>
			} placement={'top'}>
				<Box style={{maxWidth: '100%', height: '100%', color: textColor, wordBreak: 'break-word', overflowY: 'hidden'}}>
					<p style={{margin: '0'}}>{eventInfo.event.title}</p>
					<p style={{margin: '0'}}>{eventInfo.event.extendedProps.campus}</p>
				</Box>
			</Tooltip>
		)
	}

	onEventClick(info: EventClickArg): void {
		// TODO: The courses don't have url for now
		// const withCtrl = info.jsEvent.ctrlKey
		// if (withCtrl) {
		// 	const url = info.event.extendedProps.courseUrl
		// 	const win = window.open(url)
		// 	win?.focus()
		// } else {
		// 	this.props.onSelectedEvent(info.event.id)	
		// }
		this.props.onSelectedEvent(info.event.id)	
	}

	render(): React.ReactNode {
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
					events={this.props.events}
					eventClick={(info) => this.onEventClick(info)}
					eventContent={this.renderEventContent}
					locale={this.props.lang}
					themeSystem={'default'}
					stickyHeaderDates={false}
				/>
			</div>
		)
	}
}

export default Schedule
