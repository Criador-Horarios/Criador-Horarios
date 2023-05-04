import ICalendar from 'datebook/dist/ICalendar'
import CalendarOptions from 'datebook/dist/types/CalendarOptions'
import Shift from '../domain/Shift'
import i18next from 'i18next'

export default function getCalendar(shifts: Shift[]): void {
	const events = shifts.map(s => s.getAllLessons()).flat().map(l => {
		return {
			title: `${l.course.getName()} : ${i18next.t(`classType.${l.type}`)}`,
			location: l.room,
			start: new Date(l.date + 'T' + l.startTime),
			end: new Date(l.date + 'T' + l.endTime),
			description: l.courseUrl
		} as CalendarOptions
	})

	let calendar: ICalendar
	if (events.length >= 1) {
		calendar = new ICalendar(events[0])
		calendar.addProperty('TRANSP', 'OPAQUE')
		// calendar.addProperty('CATEGORIES', 'EDUCATION')
		events.forEach((v, i) => {
			// Ignore first as it is already created above
			if (i === 0) {
				return
			}

			const newCalendar = new ICalendar(v)
			newCalendar.addProperty('TRANSP', 'OPAQUE')
			// newCalendar.addProperty('CATEGORIES', 'EDUCATION')
			calendar.addEvent(newCalendar)
		})
		calendar.download(`${i18next.t('calendar.filename')}.ics`)
	}
}
