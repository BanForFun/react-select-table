export function indexOf<T>(iterable: Iterable<T>, key: T): number {
    let i = 0;
    for (const item of iterable) {
        if (item === key) return i;
        i++;
    }

    return -1;
}

export function at<T>(iterable: Iterable<T>, index: number): T | undefined {
    let i = 0;
    for (const item of iterable) {
        if (i === index) return item;
        i++;
    }
}

export function getIterator<T>(iterable: Iterable<T>) {
    return iterable[Symbol.iterator]();
}

export function* getIterableIterator<T>(iterable: Iterable<T>): IterableIterator<T> {
    for (const item of iterable) {
        yield item;
    }
}

export function* cachedIterator<T>(iterable: Iterable<T>): IterableIterator<T> {
    const iterator = getIterator(iterable);
    let current = iterator.next();

    while (!current.done) {
        const next = iterator.next();
        yield current.value;
        current = next;
    }
}

export function* map<TSource, TResult>(
    iterable: Iterable<TSource>,
    converter: ((value: TSource) => TResult)
): IterableIterator<TResult> {
    for (const item of iterable)
        yield converter(item);
}

export function count(iterable: Iterable<unknown>): number {
    const iterator = getIterator(iterable);

    let count = 0;
    let current = iterator.next();

    while (!current.done) {
        count++;
        current = iterator.next();
    }

    return count;
}