import Lesson from '../domain/Lesson'
import Shift from '../domain/Shift'
import ExcelJS from 'exceljs'
import i18next from 'i18next'

const config = {
	intervalUnit: 30,
	margin: 3,
	schedule: {
		colStart: 1,
		rowStart: 1,
		minWidth: 15,
		emptyBorder: {
			top: {style:'hair'},
			left: {style:'hair'},
			right: {style:'hair'},
			bottom: {style:'hair'}
		// eslint-disable-next-line
		} as any,
		headerBackground: '4b5761'
	},
	classes: {
		colStart: 1,
		rowStart: 2
	},
	waterMark: {
		colStart: 2,
		rowStart: 28
	},
	emptyValue: ''
}

const cols = [0, 1, 2, 3, 4, 5]
let columnNames = ['', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']
const hours = Array.from({length:12}, (v,k) => k+8)
const columnsLength = Array.from({length: hours.length * Math.floor(60/config.intervalUnit) + 1 + config.schedule.rowStart}, () => config.emptyValue)
const excelWidthOverHeight = 1400/266 // Coefficient between column width and row height ~5.26

// TODO: Needs refactor
export default async function saveToExcel(shifts: Shift[], classes: Record<string, string>): Promise<void> {
	const workbook = new ExcelJS.Workbook()
	let sheet = workbook.addWorksheet(i18next.t('excel.worksheet-title'))

	const lessons = getLessonsByDay(shifts)
	const newColumnNames = i18next.t('table.weekdays', { returnObjects: true })
	if (newColumnNames.length > 0) {
		columnNames = [''].concat(newColumnNames)
	}

	// Set schedule
	let lastColumn = 0, currCol = cols[0] + 1
	cols.forEach(col => {
		const [ overlaps, maxOverlaps ] = getOverlapsByHour(col, lessons)
		const temp = setColumn(sheet, lessons, col, currCol, maxOverlaps, overlaps)
		sheet = temp[0]
		currCol = temp[1]
		lastColumn = currCol
	})
	sheet = setOuterBorders(sheet, lastColumn)

	// Set classes
	// Classes on the right -> // sheet = setClasses(sheet, classes, lastColumn + 2, (sheet.lastRow?.number ?? 0) + 2)
	// Classes on the bottom
	sheet = setClasses(sheet, classes, 1, (sheet.lastRow?.number ?? 0) + 2)

	// Set link
	sheet = setWaterMark(sheet)

	// Set margin
	sheet.getRow(1).height = config.margin * excelWidthOverHeight
	sheet.getColumn(1).width = config.margin

	workbook.xlsx.writeBuffer().then((data: ExcelJS.Buffer): void => {
		const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
		const url = window.URL.createObjectURL(blob)
		const anchor = document.createElement('a')
		document.body.appendChild(anchor)
		anchor.href = url
		anchor.download = `${i18next.t('excel.filename')}.xlsx`
		anchor.click()
		window.URL.revokeObjectURL(url)
		document.body.removeChild(anchor)
	})
	
}

/**
 * 
 * @param sheet 
 * @param lessons 
 * @param dayOfWeek 
 * @param column 
 * @param colspan 
 * @param overlaps 
 * @returns [sheet, nextColumn, columnWidth]
 */
function setColumn(sheet: ExcelJS.Worksheet, lessons: Record<number, Record<string, Lesson[]>>, dayOfWeek: number,
	column: number, colspan: number, overlaps: Record<string, number>): [ExcelJS.Worksheet, number] {
	const currColNumber = config.schedule.colStart + column
	const col = sheet.getColumn(currColNumber)

	// Set initial values to empty
	const allColumns = Array.from({length: colspan}, (v,k) => k)
	allColumns.forEach( colToAlter => {
		const newCol = sheet.getColumn(currColNumber + colToAlter)
		newCol.values = columnsLength
		newCol.alignment = { vertical: 'middle', horizontal:'center', wrapText: true }
	})

	col.eachCell((cell, rowNumber) => {
		const i = rowNumber - config.schedule.rowStart - 1
		if (i < 0) {
			return
		}
		// Set weekday title
		if (i === 0) {
			const name = columnNames[dayOfWeek]
			cell.value = name
			cell.font = {
				color: { argb: 'FFFFFF'}
			}
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: config.schedule.headerBackground },
				bgColor: { argb: config.schedule.headerBackground }
			} as ExcelJS.FillPattern
			cell.border = {
				top: {style:'thin'},
				left: {style:'thin'},
				bottom: {style:'thin'},
				right: {style:'thin'}
			}

			// Merge if colspan is bigger than 1
			if (colspan > 1) {
				// start row, start column, end row, end column
				sheet.mergeCells(rowNumber, currColNumber, rowNumber, currColNumber + colspan - 1)
			}

			col.width = (name.length > config.schedule.minWidth) ? name.length * 1.2 : config.schedule.minWidth
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

		// For padding purposes
		let nOcc = getOccupied(overlaps, currHour, config.intervalUnit)
		// Lessons
		if (lessons[dayOfWeek] && lessons[dayOfWeek][currHour]) {
			lessons[dayOfWeek][currHour].forEach(l => {
				const nOccupied = getOccupied(overlaps, l.startTime, l.minutes)
				const lessonRow = rowNumber
				let lessonCol = currColNumber

				// Verify if needs to change column
				let usedCell = cell
				if (nOccupied > 0) {
					const duration = Math.floor(l.minutes / config.intervalUnit - 1)
					lessonCol = getFreeCellCol(sheet, lessonRow, lessonCol, duration)
					usedCell = sheet.getRow(lessonRow).getCell(lessonCol)
				}
				
				// Set to max width
				let lessonColSpan = 1
				if (nOccupied === 0 && colspan > 1) {
					lessonColSpan = colspan
				}

				const [mergeCol, mergeRow] = getCellToMerge(l, lessonRow, lessonCol, lessonColSpan)

				usedCell.value = l.exportedTitle
				usedCell.font = {
					color: { argb: 'FFFFFF'}
				}
				usedCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: '000' /* TODO l.color.replace('#', '') */ },
					bgColor: { argb: 'fff' /* TODO l.color.replace('#', '') */ }
				} as ExcelJS.FillPattern
				usedCell.border = {
					top: {style:'thin'},
					left: {style:'thin'},
					bottom: {style:'thin'},
					right: {style:'thin'}
				}

				// start row, start column, end row, end column
				sheet.mergeCells(lessonRow, lessonCol, mergeRow, mergeCol)

				// Fix remaining padding if needed
				const remainingPadding = colspan - (getOccupied(overlaps, l.startTime, config.intervalUnit) + lessonColSpan)
				if (remainingPadding > 1) {
					sheet.mergeCells(lessonRow, lessonCol + 1 , lessonRow, lessonCol + remainingPadding)
					sheet.getRow(rowNumber).getCell(lessonCol + 1).border = {...config.schedule.emptyBorder}
				} else if (remainingPadding === 1) {
					const firstEmptyCol = getFreeCellCol(sheet, rowNumber, currColNumber, config.intervalUnit)
					sheet.getRow(rowNumber).getCell(firstEmptyCol).border = {...config.schedule.emptyBorder}
				}
			})

			// Update for padding purposes
			nOcc = getOccupied(overlaps, currHour, config.intervalUnit)
		}
		// Padding with colspan > 1
		else if (colspan > 1 && cell.text === config.emptyValue && nOcc === -1) {
			// start row, start column, end row, end column
			sheet.mergeCells(rowNumber, currColNumber, rowNumber, currColNumber + colspan - 1)
			cell.border = {...config.schedule.emptyBorder}
		}
		// Padding after lessons (nOcc is nº of lessons in that hour - 1)
		// So to know if a merge is needed, we need to be sure that there is at least a diff of 2
		else if (colspan >= 2 && nOcc >= 0 && (colspan - 1 - nOcc) >= 2 ) {
			const remainingPadding = colspan - 1 - nOcc
			const firstEmptyCol = getFreeCellCol(sheet, rowNumber, currColNumber, config.intervalUnit)
			const secondEmptyCol = getFreeCellCol(sheet, rowNumber, firstEmptyCol + 1, config.intervalUnit)
			if (remainingPadding === (secondEmptyCol - firstEmptyCol + 1)) {
				sheet.getRow(rowNumber).getCell(firstEmptyCol).border = {...config.schedule.emptyBorder}
				sheet.mergeCells(rowNumber, firstEmptyCol, rowNumber, secondEmptyCol)
			}
		}
		// Padding after a lesson, but left to another lesson (specific case, when no merging is needed)
		else if (colspan == 2 && nOcc == 0) {
			const firstEmptyCol = getFreeCellCol(sheet, rowNumber, currColNumber, config.intervalUnit)
			sheet.getRow(rowNumber).getCell(firstEmptyCol).border = {...config.schedule.emptyBorder}
		}
		// Set border style on cells along lessons with overlap
		else if (colspan >= 2 && nOcc >= 0 && (colspan - 1 - nOcc) === 1 ) {
			const emptyCol = getFreeCellCol(sheet, rowNumber, currColNumber + 1, config.intervalUnit)
			sheet.getRow(rowNumber).getCell(emptyCol).border = {...config.schedule.emptyBorder}
		}
		// Set empty space border
		else if (cell.text === config.emptyValue) {
			cell.border = {...config.schedule.emptyBorder}
		}
	})

	return [sheet, column + colspan]
}

function setOuterBorders(sheet: ExcelJS.Worksheet, lastColumn: number): ExcelJS.Worksheet {
	const row = sheet.lastRow
	row?.eachCell((cell) => {
		if (cell.border) {
			cell.border['bottom'] = {style:'thin'}
		} else {
			cell.border = {
				bottom: {style: 'thin'}
			}
		}
	})

	const column = sheet.getColumn(lastColumn)
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
	shifts.forEach(s => {
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
		const lessons_by_day = value[1]
		lessons_by_day.forEach(l => {
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
	const lessonsKeys = Object.keys(classes).sort()
	const numberLessons = lessonsKeys.length
	const firstRowIndex = startRow + config.classes.rowStart
	let i = firstRowIndex, lastColumn = 0

	for (; i < (firstRowIndex + numberLessons); i++) {
		const row = sheet.getRow(i)
		row.alignment = { vertical: 'middle', horizontal:'center', wrapText: true }

		const shiftId = lessonsKeys[i - firstRowIndex]
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
			if (i === (firstRowIndex)) {
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

	// Add border to first and last row
	const firstRow = sheet.getRow(firstRowIndex)
	const lastRow = sheet.getRow(i - 1)
	for (let currCol = colNumber; currCol <= lastColumn; currCol++) {
		const topCell = firstRow.getCell(currCol)
		if (topCell.border) {
			topCell.border.top = {style:'thin'}
		} else {
			topCell.border = {
				top: {style:'thin'}
			}
		}

		const bottomCell = lastRow.getCell(currCol)
		if (bottomCell.border) {
			bottomCell.border.bottom = {style:'thin'}
		} else {
			bottomCell.border = {
				bottom: {style:'thin'}
			}
		}
	}

	// Add border to last column
	for (let rowIndex = firstRowIndex; rowIndex <= (i - 1); rowIndex++) {
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

// TODO: Improve this function
function setWaterMark(sheet: ExcelJS.Worksheet): ExcelJS.Worksheet {
	const firstColumn = config.waterMark.colStart
	const firstRow = config.waterMark.rowStart

	// Text cell
	const textCell = sheet.getRow(firstRow).getCell(firstColumn)
	textCell.alignment = {
		wrapText: false
	}
	textCell.value = i18next.t('excel.generated-by') as string
	textCell.font = {
		color: { argb: 'FFFFFF' }
	}
	textCell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: config.schedule.headerBackground },
		bgColor: { argb: config.schedule.headerBackground }
	} as ExcelJS.FillPattern
	sheet.mergeCells(firstRow, firstColumn, firstRow, firstColumn + 1)

	// Link cell
	const linkCell = sheet.getRow(firstRow).getCell(firstColumn + 2)
	linkCell.value = {
		text: 'Criador-Horarios',
		hyperlink: process.env.REACT_APP_URL ?? 'https://github.com/joaocmd/Criador-Horarios'
	}
	linkCell.font = {
		color: { argb: '1769aa' }
	}
	sheet.mergeCells(firstRow, firstColumn + 2, firstRow, firstColumn + 3)
	return sheet
}

// Auxiliar

/**
 * 
 * @param lesson 
 * @param initialRow 
 * @param initialCol 
 * @returns [column, row]
 */
function getCellToMerge(lesson: Lesson, initialRow: number, initialCol: number, colspan: number): [number, number] {
	const duration = Math.floor(lesson.minutes / config.intervalUnit - 1)
	// Col - Row
	return [initialCol + colspan - 1, initialRow + duration]
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

function getFreeCellCol(sheet: ExcelJS.Worksheet, row: number, initialCol: number, duration: number): number {
	const checkFree = (row_1: number, col: number, dur: number) => {
		for (let i = 0; i < dur; i++) {
			const empty = sheet.getRow(row_1).getCell(col + i).text === config.emptyValue
			if (!empty) {
				return false
			}
		}
		return true
	}
	let isEmpty = (sheet.getRow(row).getCell(initialCol).text === config.emptyValue)
	while (!isEmpty) {
		isEmpty = checkFree(row, ++initialCol, duration)
	}
	return initialCol
}

// Returns the nº of lessons in that hour minus 1, or -1 if there are none.
// For example, if there are 2 lessons in that hour, it will return 1
function getOccupied(overlaps: Record<string, number>, startTime: string, duration: number): number {
	const times = Array.from({length: duration / config.intervalUnit}, (v,k) => addTime(startTime, k * config.intervalUnit))
	let res = 0
	let foundAny = false
	times.forEach(time => {
		if (overlaps[time]) {
			res += overlaps[time] - 1
			foundAny = true
		} 
	})
	return foundAny ? res : -1
}