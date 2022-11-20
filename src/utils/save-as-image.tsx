import html2canvas from 'html2canvas'
import Lesson from '../domain/Lesson'
import Shift from '../domain/Shift'
import i18next from 'i18next'

export default function downloadAsImage(shifts: Shift[], darkMode: boolean): void {
	const div = document.createElement('div')
	div.className = 'imageSaver'
	document.body.appendChild(div)
	setTimeout(function(){
		const table = saveToImage(shifts, darkMode)
		div.innerHTML = table

		html2canvas(div, {
			useCORS: true,
			scrollY: -window.scrollY
		}).then(canvas => {
			document.body.removeChild(div)
			saveAs(canvas.toDataURL('image/png', 1.0), `${i18next.t('image.filename')}`)
		})
	}, 10)
}

const saveAs = (uri: string, filename: string) => {
	const link = document.createElement('a')

	if (typeof link.download === 'string') {
		link.href = uri
		link.download = filename
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	} else {
		window.open(uri)
	}
}

// FIXME: Needs refactor
const intervalUnit = 30
function saveToImage(shifts: Shift[], darkMode: boolean) {
	const lessonsByHour: Record<string, Record<number, Lesson[]>> = {}
	const overlapsLessons: Record<number, Record<string, number>> = {}
	const overlaps: Record<number, number> = {}

	shifts.map(s => {
		s.getLessons().forEach(l => {
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

	const tableLessons = getTable(lessonsByHour, overlaps, overlapsLessons, darkMode)
	const table = `${tableLessons}`

	return table
}

function getTable(lessons: Record<string, Record<number, Lesson[]>>, overlaps: Record<number, number>,
	overlapHours: Record<number, Record<string, number>>, darkMode: boolean): string {
	// Get class for light/dark mode
	const colorClass = darkMode ? 'dark' : 'light'

	// Set columns
	const cols = [0, 1, 2, 3, 4, 5]
	let header = ''
	cols.forEach(col => {
		let res = ['', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']
		const newColumnNames = i18next.t('table.weekdays', { returnObjects: true })
		if (newColumnNames.length > 0) {
			res = [''].concat(newColumnNames)
		}
		const width = overlaps[col] ?? 1
		header += `<th class="${colorClass}" colspan="${width}">${res[col]}</th>`
	})
	header = `<thead>${header}</thead>`

	// Get hours and set lessons by hour
	const hours = Array.from({length:12}, (v,k) => k+8)
	let body = ''
	let occupied: Record<string, number[]> = {}
	hours.forEach(hour => {
		// Possible hours: 'hour:00:00' or 'hour:30:00'
		const possibleHours = [String(hour).padStart(2, '0') + ':00:00', String(hour).padStart(2, '0') + ':30:00']

		possibleHours.forEach( (currHour, i) => {
			body += '<tr>'
			cols.forEach( (dayOfWeek) => {
				// Padding for putting in the correct day
				const colspanPad = getColSpan(dayOfWeek, currHour, intervalUnit, overlaps, overlapHours)
				const pad = `<td colspan="${colspanPad}"></td>`

				if (dayOfWeek === 0 && i === 0) {
					body += `<td>${String(hour).padStart(2, '0') + ':00'}</td>`	
					return
				} else if (dayOfWeek === 0 && i === 1) {
					body += `<td colspan="${colspanPad}"></td>`
					return
				}

				let remainingPadding = overlaps[dayOfWeek] ?? 1
				
				if (lessons[currHour] && lessons[currHour][dayOfWeek]) {
					lessons[currHour][dayOfWeek].forEach(l => {
						const colspan = getColSpan(dayOfWeek, currHour, l.minutes, overlaps, overlapHours)
						body += `<td style="background-color: ${/* TODO l.color */ '000'}; color: white;" 
						rowspan="${l.minutes / intervalUnit}" 
						colspan="${colspan}"> ${l.exportedTitle} </td>`
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

	return `<table class="${colorClass}" border="4px">${header}${body}</table>`
}

function setOccupied(startTime: string, dayOfWeek: number, duration: number, intervalUnit: number, colspan: number, acc: Record<string, number[]>): Record<string, number[]> {
	// eslint-disable-next-line
	const times = Array.from({length: duration / intervalUnit}, (v, k) => addTime(startTime, k * intervalUnit))
	const adder = Array.from({length: colspan}, () => dayOfWeek)
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
