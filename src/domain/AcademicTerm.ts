import i18next from 'i18next'

export default class AcademicTerm {
	term: string
	semester: number
	id: string

	constructor(obj: string) {
		const re = /^([12]{1})[º ]*([sS][a-zA-Z]*)[ ]*([0-9/]+)$/
		const match = obj.match(re)
		if (match === null) {
			throw `Unexpected academic term name: ${match}`
		}
		this.semester = +match[1]
		this.term = match[3]
		this.id = obj
	}

	static compare(a: AcademicTerm, b: AcademicTerm): number {
		const termCompare = a.term.localeCompare(b.term)
		const semCompare = a.semester.toString().localeCompare(b.semester.toString())
		return termCompare == 0 ? semCompare : termCompare
	}

	displayTitle(): string {
		return `${decodeURI(this.term)} ${this.semester}${i18next.t('settings-dialog.select.value', { count: this.semester })}`
	}
}

/*
Example:
{
	"2018/2019": [
		"2ºSemestre 2018/2019",
		"1ºSemestre 2018/2019"
	],
	"2019/2020": [
		"2º Semestre 2019/2020",
		"1º Semestre 2019/2020"
	],
	"2017/2018": [
		"2Semestre 2017/2018",
		"1Semestre 2017/2018"
	],
	"2014/2015": [
		"2 Semestre 2014/2015",
		"1 Semestre 2014/2015"
	]
}
*/
