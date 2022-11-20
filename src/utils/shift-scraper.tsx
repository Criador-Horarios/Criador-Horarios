import Shift from '../domain/Shift'
import API from './api'
import cheerio from 'cheerio'
import i18next from 'i18next'

const prefix = 'https://fenix.tecnico.ulisboa.pt'

export default async function getClasses(shifts: Shift[], academicTermId: string): Promise<Record<string, string>> {
	const shiftPage: Record<string, string> = {}
	const courseUrls = Array.from(new Set(shifts.map(shift => shift.courseId)))
	const degreeAcronyms = new Set(shifts.map(s => s.course.getAcronym()))
	await Promise.all(courseUrls
		.map(courseId => API.getCourse(courseId, Array.from(degreeAcronyms), academicTermId)
			.then(async c => {
				if (!shiftPage[courseId] && c !== null) {
					const url = c.getUrl().replace(prefix, '') + '/turnos'
					let page = null
					try {
						page = await API.getPage(url)
					} catch (err) {
						// Either fenix is broken or it is on a page that we don't parse
						console.error('Can\'t get course ' + courseId)
					}
					if (page !== null) {
						shiftPage[courseId] = page
					}
				}
			}))
	)

	// WARNING: UNNECESSARY O(N^2)
	// TODO: change forEach to reduce
	const res: Record<string, string> = {}
	shifts.forEach((shift: Shift) => {
		const page = shiftPage[shift.courseId]
		if (page === undefined) {
			res[shift.acronym] = i18next.t('shift-scraper.classes.error')
			// Couldn't get course before
			return
		}
		const $ = cheerio.load(page)

		$('tbody tr').each(function(i, element) {
			const attrs = $(element).children('td')
			if (attrs.length === 5) {
				const shiftName = $(attrs[0]).text()

				if (shiftName.includes(shift.name) && !res[shift.name]) {
					res[shift.acronym + ' - ' + shift.shiftId] = $(attrs[4]).text().replaceAll('\t', '').trim().replaceAll('\n', ', ')
				}
			}
		})
	})
	return res
}

async function getMinimalClasses(shifts: Shift[], selectedDegreesAcronyms: string[], academicTermId: string):
	Promise<[Record<string, string>, string[]]> {
	const allClasses = await getClasses(shifts, academicTermId)
	const currClasses: Record<string, string[]> = {}
	
	// Filter all shifts that are from degrees not selected
	if (selectedDegreesAcronyms.length > 0) { // If no selected Degrees, ignore this step
		const degreeAcronyms = selectedDegreesAcronyms

		Object.keys(allClasses).forEach((shift) => {
			const filteredClasses: string[] = []
			allClasses[shift].split(', ').forEach( (c) => {
				const possibleDegrees = degreeAcronyms.filter(substr => c.startsWith(substr))

				if (possibleDegrees.length > 0) { // It should only match one degree, if it matches more.... WTH
					filteredClasses.push(c)
				}
			})
			currClasses[shift] = filteredClasses.sort()
		})
	}

	// Find minimal set of classes
	const minimalClasses = findMinimalSetOfClasses(currClasses)

	// Format for showing
	const res: Record<string, string> = {}
	Object.keys(currClasses).forEach((shift) => {
		let shownClasses = currClasses[shift].join(', ')
		if (shownClasses == '') {
			shownClasses = i18next.t('classes-dialog.no-class')
		}
		res[shift] = shownClasses
	})

	return [res, minimalClasses]
}

// TODO: Decrease complexity
function findMinimalSetOfClasses(allClassesByShift: Record<string, string[]>): string[] {
	// Start the final set
	let nTotalShifts = 0

	// Gets all classes sorted by the most amount of shifts
	const classByNShifts: Record<string, string[]> = {}
	Object.entries(allClassesByShift).forEach((shift) => {
		nTotalShifts += shift[1].length > 0 ? 1 : 0
		shift[1].forEach((c) => {
			if (Object.keys(classByNShifts).includes(c)) {
				classByNShifts[c].push(shift[0])
			} else {
				classByNShifts[c] = [shift[0]]
			}
		})
	})

	let tempClassByNShifts = classByNShifts
	let nTakenShifts = 0
	const takenShifts: Set<string> = new Set()
	const takenClasses: Set<string> = new Set()

	// While to get a class each loop until every shift is taken
	while (nTakenShifts < nTotalShifts) {
		if (nTakenShifts != 0) {
			// Calculate the new shifts without the chosen ones
			tempClassByNShifts = {}
			Object.entries(allClassesByShift).forEach((shift) => {
				if (takenShifts.has(shift[0])) {
					return
				}

				shift[1].forEach((c) => {
					if (takenClasses.has(c)) { // Ignore chosen classes
						return
					}
					else if (Object.keys(tempClassByNShifts).includes(c)) {
						tempClassByNShifts[c].push(shift[0])
					} else {
						tempClassByNShifts[c] = [shift[0]]
					}
				})
			})
		}

		// Get array of the classes sorted by number of shifts
		const arrClassesSorted = Object.keys(tempClassByNShifts)
			.map((v) => {
				return [v, tempClassByNShifts[v].length] as [string, number]
			})
			.sort((a,b) => b[1] - a[1]) // Decreasing order

		// Choose one and add it to the set
		const chosenClass = arrClassesSorted[0]
		nTakenShifts += chosenClass[1]
		tempClassByNShifts[chosenClass[0]].forEach(takenShifts.add, takenShifts)
		takenClasses.add(chosenClass[0])
	}
	
	const arrTakenClasses = Array.from(takenClasses)
	arrTakenClasses.sort((a, b) => a.localeCompare(b))
	return arrTakenClasses
}

export { getMinimalClasses }