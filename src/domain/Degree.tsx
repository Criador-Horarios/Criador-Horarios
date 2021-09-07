export default class Degree {
	id: string
	acronym: string
	name: string
	isSelected = false
	academicTerms: string[]

	constructor(obj: DegreeDto) {
		this.id = obj.id
		this.acronym = obj.acronym
		this.name = obj.name
		this.academicTerms = obj.academicTerms
	}

	displayName(): string {
		return this.acronym + ' - ' + this.name
	}

	hashString(): string {
		return this.name + this.id
	}

	static compare(a: Degree, b: Degree): number {
		return a.displayName().localeCompare(b.displayName())
	}
}

// This DTO is incorrect, as we are now using the /degrees/all endpoint
export type DegreeDto = {
	academicTerm: string
	academicTerms: string[]
	acronym: string
	campus: { id: string, name: string, type: string }[]
	id: string
	info: {
		description: string
		designFor: string
		gratuity: string
		history: string
		links: string
		objectives: string
		operationRegime: string
		profissionalExits: string
		requisites: string
	}
	name: string
	teachers: string[]
	type: string
	typeName: string
	url: string
}