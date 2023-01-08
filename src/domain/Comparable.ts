export default interface Comparable {
    equals(obj: Comparable): boolean
    hashString(): string
}

export class Comparables {
	static indexOf(arr: Comparable[], obj: Comparable): number {
		const length = arr.length
		for (let i = 0; i < length; i++) {
			if (arr[i].equals(obj)) {
				return i
			}
		}
		return -1 
	}

	static indexOfBy(arr: Comparable[], obj: Comparable, compareFunc: (o1: Comparable, o2: Comparable) => boolean): number {
		const length = arr.length
		for (let i = 0; i < length; i++) {
			if (compareFunc(arr[i], obj)) {
				return i
			}
		}
		return -1 
	}

	static includes(arr: Comparable[], obj: Comparable): boolean {
		return arr.some((other: Comparable) => other.equals(obj))
	}

	static includesFunc(arr: Comparable[], obj: Comparable, compareFunc: (o1: Comparable, o2: Comparable) => boolean): boolean {
		return arr.some((other: Comparable) => compareFunc(obj, other))
	}

	static toUnique(arr: Comparable[]): Comparable[] {
		const res: Record<string, Comparable> = {}
		arr.forEach((obj: Comparable) => {
			res[obj.hashString()] = obj
		})
		return Object.values(res) as Comparable[]
	}

	static addToSet(set: Record<string, Comparable>, obj: Comparable): Record<string, Comparable> {
		set[obj.hashString()] = obj
		return set
	}
}