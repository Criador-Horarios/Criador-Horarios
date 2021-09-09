export function* combinations2<T>(arr: T[]): Generator<[T, T]> {
	for (let i = 0; i < arr.length; i++) {
		for (let j = i+1; j < arr.length; j++) {
			yield [arr[i], arr[j]]
		}
	}
}

export function* it_filter<T>(it: Iterable<T>, pred: (el: T) => boolean): Generator<T> {
	for (const el of it) {
		if (pred(el)) {
			yield el
		}
	}
}

export function it_first<T>(it: Iterable<T>): T|undefined {
	const head = it[Symbol.iterator]().next()
	if (head.done) {
		return undefined
	} else {
		return head.value
	}
}

export function it_find<T>(it: Iterable<T>, pred: (el: T) => boolean): T|undefined {
	return it_first(it_filter(it, pred))
}

export function it_contains<T>(it: Iterable<T>, pred: (el: T) => boolean): boolean {
	return it_find(it, pred) !== undefined
}
