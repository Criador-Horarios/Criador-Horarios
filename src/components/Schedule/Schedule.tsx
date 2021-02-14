import React from 'react'
import Lesson from '../../domain/Lesson'
import styles from './Schedule.module.scss'
import FullCalendar from '@fullcalendar/react'
import bootstrapPlugin from '@fullcalendar/bootstrap'
import timeGridPlugin from '@fullcalendar/timegrid'
// import './_materialFullCalendar.scss'
// import './darkly-bootstrap.min.css'
// import './cyborg-bootstrap.min.css'

class Schedule extends React.PureComponent <{
	onSelectedEvent: (id: string) => void
	events: Lesson[]
	lang: string
	darkMode: boolean
}, unknown>{
	componentDidUpdate() {
		// require('./darkly-bootstrap.min.css')
		if (this.props.darkMode) {
			// require('./cyborg-bootstrap.min.css')
		}
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
					eventClick={(info) => this.props.onSelectedEvent(info.event.id)}
					locale={this.props.lang}
					themeSystem={'default'}
					stickyHeaderDates={false}
				/>
			</div>
		)
	}
}

export default Schedule
