import Lesson from '../domain/Lesson'
import Shift from '../domain/Shift'

// FIXME: Needs refactor
const intervalUnit = 30
export default function saveToExcel(shifts: Shift[], classes: Record<string, string>) {
	const lessonsByHour: Record<string, Record<number, Lesson[]>> = {}
	const overlapsLessons: Record<number, Record<string, number>> = {}
	const overlaps: Record<number, number> = {}

	shifts.map(s => {
		s.lessons.forEach(l => {
			const hour = l.startTime
			const overlapHours = Array.from({length: l.minutes / intervalUnit}, (v,k) => addTime(l.startTime, k * intervalUnit))

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

	const tableLessons = getTable(lessonsByHour, overlaps, overlapsLessons)
	const tableClasses = getTableClasses(classes)
	const table = `<div>${tableLessons}${tableClasses}</div>`
	console.log(table)

	const ua = window.navigator.userAgent
	const msie = ua.indexOf('MSIE ')
	let sa
	const txtArea1 = document.getElementById('txtArea1') as any

	// If Internet Explorer
	if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv:11\./)) {
		txtArea1.document.open('txt/html', 'replace')
		txtArea1.document.write(table)
		txtArea1.document.close()
		txtArea1.focus()
		sa = txtArea1.document.execCommand('SaveAs', true)
	}  
	else {
		const el = document.createElement('a')
		const url = 'data:application/vnd.ms-excel,' + encodeURIComponent(table)
		el.setAttribute('href', url)
		el.setAttribute('download', 'ist-horario.xls')
		document.body.appendChild(el)
		el.click()
		document.body.removeChild(el)
	}

	return
}

function getTable(lessons: Record<string, Record<number, Lesson[]>>, overlaps: Record<number, number>, overlapHours: Record<number, Record<string, number>>): string {
	// Set columns
	const cols = [0, 1, 2, 3, 4, 5]
	let header = ''
	cols.forEach(col => {
		const res = ['', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']
		const width = overlaps[col] ?? 1
		header += `<th bgcolor="#212121" style="text-align: center; color: white;" colspan="${width}">${res[col]}</th>`
	})
	header = `<thead>${header}</thead>`

	// Get hours and set lessons by hour
	const hours = Array.from({length:12}, (v,k) => k+8)
	let body = ''
	let occupied: Record<string, number[]> = {}
	hours.forEach(hour => {
		// Possible hours: 'hour:00:00' or 'hour:30:00'
		const possibleHours = [String(hour).padStart(2, '0') + ':00:00', String(hour).padStart(2, '0') + ':30:00']

		const currHour = possibleHours[0]
		possibleHours.forEach( (currHour, i) => {
			body += '<tr>'
			cols.forEach( (dayOfWeek) => {
				// Padding for putting in the correct day
				const colspanPad = getColSpan(dayOfWeek, currHour, intervalUnit, overlaps, overlapHours)
				const pad = `<td style="border: dotted;" colspan="${colspanPad}"></td>`

				if (dayOfWeek === 0 && i === 0) {
					body += `<td style="text-align: center;">${String(hour).padStart(2, '0') + ':00'}</td>`	
					return
				} else if (dayOfWeek === 0 && i === 1) {
					body += `<td colspan="${colspanPad}"></td>`
					return
				}

				let remainingPadding = overlaps[dayOfWeek] ?? 1
				
				if (lessons[currHour] && lessons[currHour][dayOfWeek]) {
					lessons[currHour][dayOfWeek].forEach(l => {
						const colspan = getColSpan(dayOfWeek, currHour, l.minutes, overlaps, overlapHours)
						body += `<td style="vertical-align: middle; text-align: center; background-color: ${l.color}; color: white;" 
						rowspan="${l.minutes / intervalUnit}" 
						colspan="${colspan}">${l.exportedTitle}</td>`
						occupied = setOccupied(l.startTime, dayOfWeek, l.minutes, intervalUnit, colspan, occupied)
						remainingPadding -= colspan
					})
				} else if (!occupied[currHour] || !occupied[currHour].includes(dayOfWeek)) {
					body += pad
					// As the padding was added, we don't want more padding
					return
				}
				
				const nOccupied = countOccupied(occupied[currHour], dayOfWeek)
				if (remainingPadding > 0 && occupied[currHour] && nOccupied < overlaps[dayOfWeek]) {	
					const pad = `<td colspan="${colspanPad - nOccupied}"></td>`
					body += pad
				}
			})
			body += '</tr>'
		})
	})
	body = `<tbody>${body}</tbody>`

	return `<table border="8px">${header}${body}</table>`
}

function setOccupied(startTime: string, dayOfWeek: number, duration: number, intervalUnit: number, colspan: number, acc: Record<string, number[]>): Record<string, number[]> {
	const times = Array.from({length: duration / intervalUnit}, (v,k) => addTime(startTime, k * intervalUnit))
	const adder = Array.from({length: colspan}, (v,k) => dayOfWeek)
	times.forEach(time => {
		if (acc[time]) {
			acc[time] = acc[time].concat(adder)
			acc[time].sort()
		} else {
			acc[time] = adder
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

function getColSpan(dayOfWeek: number, hour: string, duration: number, overlaps: Record<number, number>, overlapHours: Record<number, Record<string, number>>): number {
	const times = Array.from({length: duration / intervalUnit}, (v,k) => addTime(hour, k * intervalUnit))
	// If not on a column with overlaps
	if (!overlaps[dayOfWeek]) {
		return 1
	}
	let res = overlaps[dayOfWeek]
	times.forEach(time => {
		// If on column with overlaps but not in that hour
		if (overlaps[dayOfWeek] && overlapHours[dayOfWeek] && overlapHours[dayOfWeek][time] === 1) {
			res = (overlaps[dayOfWeek] < res) ? overlaps[dayOfWeek] : res
		}
		// If on column with overlaps in that hour
		else if (overlaps[dayOfWeek] && overlapHours[dayOfWeek] && overlapHours[dayOfWeek][time] === overlaps[dayOfWeek]) {
			res = (1 < res) ? 1 : res
		}
		// If on column with overlaps, but less overlaps than the maximum
		else if (overlaps[dayOfWeek] && overlapHours[dayOfWeek] && overlapHours[dayOfWeek][time] < overlaps[dayOfWeek]) {
			// TODO: maybe optimize for full column?
			// const newVal = overlaps[dayOfWeek] - overlap
			res = (1 < res) ? 1 : res
		}
	})
	return res
}

function countOccupied(arr: number[], num: number): number {
	return arr.reduce( (acc, curr) => {
		if (curr === num) {
			acc++
		}
		return acc
	}, 0)
}

function getTableClasses(classes: Record<string, string>): string {
	let body = ''
	const classesOrdered = Object.entries(classes).sort( (a, b) => {
		return a[0].localeCompare(b[0])
	})
	classesOrdered.forEach((c) => {
		body += `<tr><td>${c[0]}</td>`
		body += 
			c[1].split(',').map(s => {
				return `<td>${s}</td>`
			}).join('')
		body += '</tr>'
	})
	return `<table border="8px" style="margin-top: 200px;">${body}</table>`
}
