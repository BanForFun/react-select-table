import { Converter, Predicate } from './types';

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

export function countBy<T>(iterable: Iterable<T>, predicate: Predicate<T>): number {
    const iterator = getIterator(iterable);

    let count = 0;
    let current = iterator.next();

    while (!current.done) {
        if (predicate(current.value)) count++;
        current = iterator.next();
    }

    return count;
}

export function minBy<F, T>(iterable: Iterable<F>, by: Converter<F, T>): F {
    let min: F | undefined = undefined;
    for (const value of iterable) {
        if (min === undefined || by(value) < by(min))
            min = value;
    }

    if (min === undefined)
        throw new Error('Iterable is empty');

    return min;
}