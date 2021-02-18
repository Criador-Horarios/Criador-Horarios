import Lesson from '../domain/Lesson'
import Shift from '../domain/Shift'

export default function fnExcelReport(shifts: Shift[]) {
	let tab_text='<table border="2px"><tr bgcolor="#87AFC6">'
	let textRange//, j=0

	const lessonsByHour: Record<string, Lesson[]> = {}
	shifts.map(s => {
		s.lessons.forEach(l => {
			const hour = l.startTime
			if (lessonsByHour[hour]) {
				lessonsByHour[hour].push(l)
			} else {
				lessonsByHour[hour] = [l]
			}
		})
	})

	const table = getTable(lessonsByHour)
	tab_text = table
	console.log(table)

	// return
	// const tab: any = document.getElementsByTagName('table')[4] // id of table
	// const events: any = document.getElementsByTagName('table')[7] // id of table

	// for(j = 0 ; j < tab.rows.length ; j++) {
	// 	tab_text = tab_text + tab.rows[j].innerHTML+'</tr>'
	// 	//tab_text=tab_text+'</tr>';
	// }

	// tab_text = tab_text + '</table>'
	// tab_text = tab_text.replace(/<A[^>]*>|<\/A>/g, '')			//remove if u want links in your table
	// tab_text = tab_text.replace(/<img[^>]*>/gi,'') 				// remove if u want images in your table
	// tab_text = tab_text.replace(/<input[^>]*>|<\/input>/gi, '') 	// removes input params

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
		// sa = window.open('data:application/vnd.ms-excel,' + encodeURIComponent(tab_text))
	}

	return (sa)
}

function getTable(lessons: Record<string, Lesson[]>): string {

	// Set columns
	const cols = [0, 1, 2, 3, 4, 5]
	let header = ''
	cols.forEach(col => {
		const res = ['', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']
		header += `<td>${res[col]}</td>`
	})
	header = `<thead bgcolor="#87AFC6">${header}</thead>`

	// Get hours and set lessons by hour
	const intervalUnit = 30
	const hours = Array.from({length:12}, (v,k) => k+8)
	let body = ''
	let paddingByHour: Record<string, number[]> = {}
	hours.forEach(hour => {
		// Possible hours: hour:00:00 or hour:30:00
		const possibleHours = [String(hour).padStart(2, '0') + ':00:00', String(hour).padStart(2, '0') + ':30:00']
		let firstLessons: Lesson[] = []
		if (lessons[possibleHours[0]]) {
			lessons[possibleHours[0]].sort( (a: Lesson, b: Lesson) => {
				return a.daysOfWeek[0] <= b.daysOfWeek[0] ? -1 : 1
			})
			firstLessons = firstLessons.concat(lessons[possibleHours[0]])
		}
		let secondLessons: Lesson[] = []
		if (lessons[possibleHours[1]]) {
			lessons[possibleHours[1]].sort( (a: Lesson, b: Lesson) => {
				return a.daysOfWeek[0] <= b.daysOfWeek[0] ? -1 : 1
			})
			secondLessons = secondLessons.concat(lessons[possibleHours[1]])
		}

		// Padding for putting in the correct day
		const pad = '<td></td>'
		const eventsCreator = (l: Lesson) => {
			const padding = getPadding(l.startTime, l.daysOfWeek[0], paddingByHour)
			let remainingPadding = 0, res = ''
			console.log(padding, l, paddingByHour[l.startTime])
			while (remainingPadding < padding) {
				res += pad
				remainingPadding++
			}
			res += `<td rowspan="${l.minutes / intervalUnit}">${l.title}</td>`
			paddingByHour = setPadding(l.startTime, l.daysOfWeek[0], l.minutes, intervalUnit, paddingByHour)
			return res
		}

		const firstEvents = firstLessons.map(l => eventsCreator(l))
		const secondEvents = secondLessons.map(l => eventsCreator(l))

		body += 
			`<tr>
				<td>${hour}:00
				</td>
				${firstEvents.join('')}
			</tr>
			<tr>
				<td></td>
				${secondEvents.join('')}
			</tr>`
	})
	body = `<tbody>${body}</tbody>`

	return `<table border="2px">${header}${body}</table>`
}

function setPadding(startTime: string, dayOfWeek: number, duration: number, intervalUnit: number, acc: Record<string, number[]>): Record<string, number[]> {
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

function getPadding(startTime: string, dayOfWeek: number, acc: Record<string, number[]>): number {
	const counters = acc[startTime] ?? []
	let padding = -1
	counters.forEach(c => {
		if (c < dayOfWeek) {
			padding = dayOfWeek - c - 1
		} else if ( c === dayOfWeek) {
			// TODO: Overlap
			return 0
		}
	})

	return padding === -1 ? dayOfWeek -1 : padding
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