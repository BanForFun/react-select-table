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

export function* map<TSource, TResult>(iterable: Iterable<TSource>, converter: ((value: TSource) => TResult)): Iterable<TResult> {
    for (const item of iterable)
        yield converter(item);
}