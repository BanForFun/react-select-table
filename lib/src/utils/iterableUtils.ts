import { Converter, Predicate } from './types';

const AllPass: Predicate<unknown> = () => true;

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

export function min<T>(iterable: Iterable<T>): T {
    return minBy(iterable, v => v);
}

export function count<T>(iterable: Iterable<T>, predicate: Predicate<T> = AllPass): number {
    const iterator = getIterator(iterable);

    let count = 0;
    let current = iterator.next();

    while (!current.done) {
        if (predicate(current.value)) count++;
        current = iterator.next();
    }

    return count;
}

export function first<T>(iterable: Iterable<T>, predicate: Predicate<T> = AllPass): T | undefined {
    for (const value of iterable) {
        if (predicate(value)) return value;
    }
}

export function all<T>(iterable: Iterable<T>, predicate: Predicate<T>): boolean {
    for (const value of iterable) {
        if (!predicate(value)) return false;
    }

    return true;
}

export function some<T>(iterable: Iterable<T>, predicate: Predicate<T>): boolean {
    for (const value of iterable) {
        if (predicate(value)) return true;
    }

    return false;
}