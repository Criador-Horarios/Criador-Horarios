import Shift from '../domain/Shift'
import API from './api'
import cheerio from 'cheerio'
import i18next from 'i18next'

const prefix = 'https://fenix.tecnico.ulisboa.pt'

export default async function (shifts: Shift[]): Promise<Record<string, string>> {
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
