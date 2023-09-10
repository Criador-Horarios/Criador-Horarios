import Comparable from './Comparable'
import Degree, { MiniDegreeDtoV2 } from './Degree'

export default class Class implements Comparable {
	name: string
	degree: Degree | null
	curricularYear: number

	constructor(obj: ClassDto) {
		this.name = obj.name
		this.curricularYear = obj.curricularYear
		this.degree = Degree.fromMiniDto(obj.degree)
	}

	displayName(): string {
		return this.name
	}

	hashString(): string {
		return this.name
	}

	equals(other: Class): boolean {
		return this.name === other.name
	}

	static compare(a: Class, b: Class): number {
		return a.displayName().localeCompare(b.displayName())
	}
}

export type ClassDto = {
	curricularYear: number
	name: string
	degree: MiniDegreeDtoV2
}
