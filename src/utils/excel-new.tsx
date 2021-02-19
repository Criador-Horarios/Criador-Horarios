import Lesson from '../domain/Lesson'
import Shift from '../domain/Shift'
import ExcelJS from 'exceljs'

const config = {
	intervalUnit: 30,
	schedule: {
		colStart: 1,
		rowStart: 1
	},
	classes: {
		colStart: 1,
		rowStart: 1
	}
}

const cols = [0, 1, 2, 3, 4, 5]
const columnNames = ['', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']
const hours = Array.from({length:12}, (v,k) => k+8)
const columnsLength = Array.from({length: hours.length * Math.floor(60/config.intervalUnit) + 1 + config.schedule.rowStart}, (v,k) => '')

// FIXME: Add i18n
export default async function saveToExcel(shifts: Shift[], classes: Record<string, string>) {
	const workbook = new ExcelJS.Workbook()
	let sheet = workbook.addWorksheet('Horário')

	const lessons = getLessonsByDay(shifts)

	// Set columns
	const header = ''
	// sheet.spliceColumns(0,0, cols)
	// sheet.columns = [
	// 	{ key: 'idClient'},
	// 	{ key: 'name'},
	// 	{ key: 'tel'},
	// 	{ key: 'adresse'}
	// ] as ExcelJS.Column[]

	// Set schedule
	let lastColumn = 0, currCol = cols[0] + 1
	cols.forEach(col => {
		const [ overlaps, maxOverlaps ] = getOverlapsByHour(col, lessons)
		// console.log(overlaps, maxOverlaps)
		const temp = setColumn(sheet, lessons, col, currCol, maxOverlaps)
		sheet = temp[0]
		currCol = temp[1]
		lastColumn = currCol - 1
	})
	sheet = setOuterBorders(sheet)

	// Set classes
	// sheet = setClasses(sheet, classes, lastColumn + 2, (sheet.lastRow?.number ?? 0) + 2)
	sheet = setClasses(sheet, classes, 1, (sheet.lastRow?.number ?? 0) + 2)

	workbook.xlsx.writeBuffer().then((data: any): void => {
		const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
		const url = window.URL.createObjectURL(blob)
		const anchor = document.createElement('a')
		document.body.appendChild(anchor)
		anchor.href = url
		anchor.download = 'ist-horario.xlsx'
		anchor.click()
		window.URL.revokeObjectURL(url)
		document.body.removeChild(anchor)
	})
	
}

function setColumn(sheet: ExcelJS.Worksheet, lessons: Record<number, Record<string, Lesson[]>>, dayOfWeek: number, column: number, colspan: number): [ExcelJS.Worksheet, number] {
	const col = sheet.getColumn(config.schedule.colStart + column)
	// Set initial values to empty
	col.values = columnsLength
	col.alignment = { vertical: 'middle', horizontal:'center', wrapText: true }

	col.eachCell((cell, rowNumber) => {
		const i = rowNumber - config.schedule.rowStart - 1
		if (i < 0) {
			return
		}
		if (i === 0) {
			const name = columnNames[dayOfWeek]
			cell.value = columnNames[dayOfWeek]
			cell.font = {
				color: { argb: 'FFFFFF'}
			}
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: '000000' },
				bgColor: { argb: '000000'}
			} as ExcelJS.FillPattern

			col.width = (name.length > 0) ? name.length * 1.2 : 10
			return
		}

		let currHour = String(hours[Math.floor((i-1)/2)]).padStart(2, '0')
		// Hour title
		if (dayOfWeek === 0 && i%2 === 1) {
			currHour += ':00'
			cell.value = currHour
			cell.border = {
				top: {style:'thin'},
				left: {style:'thin'},
				bottom: {style:'dotted'},
				right: {style:'thin'}
			}
			return
		} 
		// Clear hour title (half hour)
		else if (dayOfWeek === 0 && i%2 === 0) {
			cell.border = {
				left: {style:'thin'},
				bottom: {style:'thin'},
				right: {style:'thin'}
			}
			return
		}

		currHour += (i%2 === 1) ? ':00:00' : ':30:00'
		// Lessons
		if (lessons[dayOfWeek] && lessons[dayOfWeek][currHour]) {
			// FIXME: only works for lessons not overlapping
			// FIXME: check if occupied
			lessons[dayOfWeek][currHour].forEach(l => {
				const currCellKey = cell.$col$row.replaceAll('$', '')
				const cellToMerge = getCellToMerge(l, currCellKey)

				cell.value = l.exportedTitle
				cell.font = {
					color: { argb: 'FFFFFF'}
				}
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: l.color.replace('#', '') },
					bgColor: { argb: l.color.replace('#', '')}
				} as ExcelJS.FillPattern
				cell.border = {
					top: {style:'thin'},
					left: {style:'thin'},
					bottom: {style:'thin'},
					right: {style:'thin'}
				}

				sheet.mergeCells(`${currCellKey}:${cellToMerge}`)
			})
		}
	})

	return [sheet, column + colspan]
}

function setOuterBorders(sheet: ExcelJS.Worksheet): ExcelJS.Worksheet {
	const row = sheet.lastRow
	row?.eachCell((cell, colNumber) => {
		if (cell.border) {
			cell.border['bottom'] = {style:'thin'}
		} else {
			cell.border = {
				bottom: {style: 'thin'}
			}
		}
	})

	// FIXME: ExcelJS did not add to type definition
	const column = (sheet as any).lastColumn as ExcelJS.Column | undefined
	column?.eachCell((cell, rowNumber) => {
		if ( (rowNumber - 1) < config.schedule.rowStart) {
			return
		}
		if (cell.border) {
			cell.border['right'] = {style:'thin'}
		} else {
			cell.border = {
				right: {style: 'thin'}
			}
		}
	})
	return sheet
}

function getLessonsByDay(shifts: Shift[]): Record<number, Record<string, Lesson[]>> {
	const res: Record<number, Record<string, Lesson[]>> = {}
	shifts.map(s => {
		s.lessons.forEach(l => {
			const hour = l.startTime

			// For adding the lessons
			const dayOfWeek = l.daysOfWeek[0]
			if (res[dayOfWeek]) {
				if (res[dayOfWeek][hour]) {		
					res[dayOfWeek][hour].push(l)
				} else {
					res[dayOfWeek][hour] = [l]
				}
			} else {
				res[dayOfWeek] = {}
				res[dayOfWeek][hour] = [l]
			}
		})
	})
	return res
}

function getOverlapsByHour(dayOfWeek: number, lessons: Record<number, Record<string, Lesson[]>>): [Record<string, number>, number] {
	const res: Record<string, number> = {}
	let maxOverlaps = 1
	if (!lessons[dayOfWeek]) {
		// Ignore columns without lessons
		return  [{}, 1]
	}
	Object.entries(lessons[dayOfWeek]).forEach((value) => {
		const lessons = value[1]
		lessons.forEach(l => {
			const overlapHours = Array.from({length: Math.floor(l.minutes / config.intervalUnit)}, (v,k) => addTime(l.startTime, k * config.intervalUnit))
			overlapHours.forEach(hour => {	
				if (res[hour]) {		
					const newVal = res[hour] + 1
					res[hour] = newVal
					maxOverlaps = (newVal > maxOverlaps) ? newVal : maxOverlaps

				} else {
					res[hour] = 1
				}
			})
		})
	})
	return [res, maxOverlaps]
}

function setClasses(sheet: ExcelJS.Worksheet, classes: Record<string, string>, startColumn: number, startRow: number): ExcelJS.Worksheet {
	const colNumber = startColumn + config.classes.colStart
	const lessonsKeys = Object.keys(classes)
	const numberLessons = lessonsKeys.length
	let i = startRow + config.classes.rowStart, lastColumn = 0
	for (; i < (startRow + numberLessons); i++) {
		const row = sheet.getRow(i)
		row.alignment = { vertical: 'middle', horizontal:'center', wrapText: true }

		const shiftId = lessonsKeys[i - startRow]
		// Set shift id
		const shiftCell = row.getCell(colNumber)
		shiftCell.value = shiftId
		shiftCell.border = {
			top: {style:'thin'},
			left: {style:'thin'},
			bottom: {style:'thin'},
			right: {style:'thin'}
		}

		// Set classes
		const currClasses = classes[shiftId].split(',')
		let currCol = colNumber + 1
		currClasses.forEach(c => {
			// Set class
			const currCel = row.getCell(currCol)
			currCel.value = c
			if (i === (startRow + config.classes.rowStart)) {
				currCel.border = {
					top: {style:'thin'}
				}
			}
			lastColumn = (currCol > lastColumn) ? currCol : lastColumn
			
			// Increase width if necessary
			const currWidth = sheet.getColumn(currCol).width ?? 0
			sheet.getColumn(currCol).width = (c.length > currWidth) ? c.length*1.2 : currWidth
			currCol++
		})
	}

	// Add border to last row
	const lastRow = sheet.getRow(i - 1)
	for (let currCol = colNumber; currCol <= lastColumn; currCol++) {
		const currCel = lastRow.getCell(currCol)
		if (currCel.border) {
			currCel.border.bottom = {style:'thin'}
		} else {
			currCel.border = {
				bottom: {style:'thin'}
			}
		}
	}

	// Add border to last column
	for (let rowIndex = startRow + config.classes.rowStart; rowIndex <= (i - 1); rowIndex++) {
		const currRow = sheet.getRow(rowIndex)
		const currCel = currRow.getCell(lastColumn)
		if (currCel.border) {
			currCel.border.right = {style:'thin'}
		} else {
			currCel.border = {
				right: {style:'thin'}
			}
		}
	}

	return sheet
}

// Auxiliar

function getCellToMerge(lesson: Lesson, initialCell: string): string {
	const duration = lesson.minutes / config.intervalUnit - 1
	const re = /([A-Z]+)(\d+)/
	const match = initialCell.match(re)
	if (match === null) {
		throw 'Error getting cell to merge (Excel)'
	}
	const col = match[1]
	const row = +match[2] + duration
	return `${col}${row}`
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