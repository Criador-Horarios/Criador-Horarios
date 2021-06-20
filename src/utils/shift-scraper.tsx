import Shift from '../domain/Shift'
import API from './api'
import cheerio from 'cheerio'
import i18next from 'i18next'
import Degree from '../domain/Degree'

const prefix = 'https://fenix.tecnico.ulisboa.pt'

export default async function getClasses(shifts: Shift[]): Promise<Record<string, string>> {
	const shiftPage: Record<string, string> = {}
	const courseUrls = Array.from(new Set(shifts.map(shift => shift.courseId)))
	await Promise.all(courseUrls
		.map(courseId => API.getCourse(courseId)
			.then(async c => {
				if (!shiftPage[courseId] && c !== null) {
					const url = c.url.replace(prefix, '') + '/turnos'
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
				
				if (shiftName.includes(shift.shiftId) && !res[shift.name]) {
					res[shift.acronym + ' - ' + shift.shiftId] = $(attrs[4]).text().replaceAll('\t', '').trim().replaceAll('\n', ', ')
				}
			}
		})
	})
	return res
}

async function getMinimalClasses(shifts: Shift[], selectedDegrees: Degree[]): Promise<Record<string, string>> {
	const allClasses = await getClasses(shifts)

	// Filter all shifts that are from degrees not selected
	if (selectedDegrees.length > 0) { // If no selected Degrees, ignore this step
		const re = /([a-zA-Z-]+)[0-9]+$/
		const degreeAcronyms = selectedDegrees.map(d => d.acronym)

		Object.keys(allClasses).forEach((shift) => {
			const filteredClasses: string[] = []
			allClasses[shift].split(', ').forEach( (c) => {
				const match = c.match(re)
				if (match === null) {
					throw 'Unexpected class name'
				}

				const currDegree = match[1]
				if (degreeAcronyms.indexOf(currDegree) != -1) {
					filteredClasses.push(c)
				}
			})
			allClasses[shift] = filteredClasses.join(', ')
		})
	}
	
	return allClasses
}

export { getMinimalClasses }