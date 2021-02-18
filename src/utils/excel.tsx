import Lesson from '../domain/Lesson'
import Shift from '../domain/Shift'

// TODO: Finish overlaps
export default function fnExcelReport(shifts: Shift[]) {
	let tab_text='<table border="2px"><tr bgcolor="#87AFC6">'
	let textRange//, j=0

	const lessonsByHour: Record<string, Record<number, Lesson[]>> = {}
	const overlapsLessons: Record<number, Record<string, number>> = {}
	const overlaps: Record<number, number> = {}

	shifts.map(s => {
		s.lessons.forEach(l => {
			const hour = l.startTime
			const overlapHours = Array.from({length: l.minutes / 30}, (v,k) => addTime(l.startTime, k * 30))

			// For adding the lessons
			const dayOfWeek = l.daysOfWeek[0]
			if (lessonsByHour[hour]) {
				if (lessonsByHour[hour][dayOfWeek]) {		
					lessonsByHour[hour][dayOfWeek].push(l)
				} else {
					lessonsByHour[hour][dayOfWeek] = [l]
				}
			} else {
				lessonsByHour[hour] = {}
				lessonsByHour[hour][dayOfWeek] = [l]
			}

			// For checking overlaps
			overlapHours.forEach(hour => {
				if (overlapsLessons[dayOfWeek]) {
					if (overlapsLessons[dayOfWeek][hour]) {		
						overlapsLessons[dayOfWeek][hour] += 1
						if (overlaps[dayOfWeek]) {
							const oldVal = overlaps[dayOfWeek], newVal = overlapsLessons[dayOfWeek][hour]
							overlaps[dayOfWeek] = newVal > oldVal ? newVal : oldVal
						} else {
							overlaps[dayOfWeek] = overlapsLessons[dayOfWeek][hour]
						}
					} else {
						overlapsLessons[dayOfWeek][hour] = 1
					}
				} else {
					overlapsLessons[dayOfWeek] = {}
					overlapsLessons[dayOfWeek][hour] = 1
				}
			})
		})
	})

	const table = getTable(lessonsByHour, overlaps, overlapsLessons)
	tab_text = table
	console.log(table)

	const ua = window.navigator.userAgent
	const msie = ua.indexOf('MSIE ')
	let sa
	const txtArea1 = document.getElementById('txtArea1') as any

	// If Internet Explorer
	if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv:11\./)) {
		txtArea1.document.open('txt/html', 'replace')
		txtArea1.document.write(tab_text)
		txtArea1.document.close()
		txtArea1.focus()
		sa = txtArea1.document.execCommand('SaveAs', true)
	}  
	else {
		//other browser
		sa = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text))
	}

	return (sa)
}

function getTable(lessons: Record<string, Record<number, Lesson[]>>, overlaps: Record<number, number>, overlapHours: Record<number, Record<string, number>>): string {

	// Set columns
	const cols = [0, 1, 2, 3, 4, 5]
	let header = ''
	cols.forEach(col => {
		const res = ['', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']
		const width = overlaps[col] ?? 1
		header += `<td colspan="${width}">${res[col]}</td>`
	})
	header = `<thead bgcolor="#87AFC6">${header}</thead>`

	// Get hours and set lessons by hour
	const intervalUnit = 30
	const hours = Array.from({length:12}, (v,k) => k+8)
	let body = ''
	let occupied: Record<string, number[]> = {}
	hours.forEach(hour => {
		// Possible hours: hour:00:00 or hour:30:00
		const possibleHours = [String(hour).padStart(2, '0') + ':00:00', String(hour).padStart(2, '0') + ':30:00']

		const currHour = possibleHours[0]
		possibleHours.forEach( (currHour, i) => {
			body += '<tr>'
			cols.forEach( (dayOfWeek) => {
				// Padding for putting in the correct day
				const pad = `<td colspan="${getColSpan(dayOfWeek, currHour, overlaps, overlapHours)}"></td>`

				if (dayOfWeek === 0 && i === 0) {
					body += `<td>${String(hour).padStart(2, '0') + ':00'}</td>`	
					return
				} else if (dayOfWeek === 0 && i === 1) {
					body += pad
					return
				}
				
				if (lessons[currHour] && lessons[currHour][dayOfWeek]) {
					lessons[currHour][dayOfWeek].forEach(l => {
						body += `<td style="vertical-align: middle; text-align: center; background-color: ${l.color}; color: white;" 
						rowspan="${l.minutes / intervalUnit}" 
						colspan="${getColSpan(dayOfWeek, currHour, overlaps, overlapHours)}">${l.title}</td>`
						occupied = setOccupied(l.startTime, dayOfWeek, l.minutes, intervalUnit, occupied)
					})
				} else if (!occupied[currHour] || !occupied[currHour].includes(dayOfWeek)) {
					body += pad
				}
			})
			body += '</tr>'
		})
	})
	body = `<tbody>${body}</tbody>`

	return `<table border="2px">${header}${body}</table>`
}

function setOccupied(startTime: string, dayOfWeek: number, duration: number, intervalUnit: number, acc: Record<string, number[]>): Record<string, number[]> {
	const times = Array.from({length: duration / intervalUnit}, (v,k) => addTime(startTime, k * intervalUnit))
	times.forEach(time => {
		if (acc[time]) {
			acc[time].push(dayOfWeek)
			acc[time].sort()
		} else {
			acc[time] = [dayOfWeek]
		}
	})
	return acc
}

function addTime(time: string, increment: number): string {
	if (increment === 0) {
		return time
	}

	const args = time.split(':')
	let hour = +args[0], minutes = +args[1]
	minutes += increment
	if (minutes % 60 == 0) {
		const plusHours = minutes/60
		minutes = 0
		hour += plusHours
	} else {
		const plusHours = Math.floor(minutes/60)
		minutes = minutes % 60
		hour += plusHours
	}

	return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
}

function getColSpan(dayOfWeek: number, hour: string, overlaps: Record<number, number>, overlapHours: Record<number, Record<string, number>>): number {
	// If not on a column with overlaps
	if (!overlaps[dayOfWeek]) {
		return 1
	}
	// If on column with overlaps but not in that hour
	else if (overlaps[dayOfWeek] && (!overlapHours[dayOfWeek] || !Object.keys(overlapHours[dayOfWeek]).includes(hour))) {
		return overlaps[dayOfWeek]
	}

	// If on column with overlaps in that hour
	else if (overlaps[dayOfWeek] && (overlapHours[dayOfWeek] && Object.keys(overlapHours[dayOfWeek]).includes(hour))) {
		return 1
	}
	return 1
}