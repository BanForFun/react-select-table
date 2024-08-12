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

export function* map<TSource, TResult>(
    iterable: Iterable<TSource>,
    converter: ((value: TSource) => TResult)
): IterableIterator<TResult> {
    for (const item of iterable)
        yield converter(item);
}