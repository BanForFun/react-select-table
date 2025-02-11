import { ConverterCallback, PredicateCallback } from './types';

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

export function* limit<T>(iterable: Iterable<T>, count: number): IterableIterator<T> {
    for (const value of iterable) {
        yield value;
        if (--count <= 0) break;
    }
}

export function* skip<T>(iterable: Iterable<T>, count: number): IterableIterator<T> {
    for (const value of iterable) {
        if (count > 0) {
            count--;
            continue;
        }
        yield value;
    }
}

export function first<T>(iterable: Iterable<T>): T | undefined {
    return at(iterable, 0);
}

export function find<T>(iterable: Iterable<T>, predicate: PredicateCallback<T>): T | undefined {
    return first(filter(iterable, predicate));
}

export function createIterator<T>(iterable: Iterable<T>) {
    return iterable[Symbol.iterator]();
}

export function* createIterableIterator<T>(iterable: Iterable<T>): IterableIterator<T> {
    for (const item of iterable) {
        yield item;
    }
}

export function* prefetch<T>(iterable: Iterable<T>): IterableIterator<T> {
    const iterator = createIterator(iterable);
    let current = iterator.next();
    while (!current.done) {
        const next = iterator.next();
        yield current.value;
        current = next;
    }
}

export function* map<TSource, TResult>(
    iterable: Iterable<TSource>,
    converter: ((value: TSource, index: number) => TResult)
): IterableIterator<TResult> {
    let index = 0;
    for (const item of iterable)
        yield converter(item, index++);
}

export function minBy<F, T>(iterable: Iterable<F>, by: ConverterCallback<F, T>): F {
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

export function count<T>(iterable: Iterable<T>): number {
    const iterator = createIterator(iterable);

    let count = 0;
    let current = iterator.next();

    while (!current.done) {
        count++;
        current = iterator.next();
    }

    return count;
}

export function all<T>(iterable: Iterable<T>, predicate: PredicateCallback<T>): boolean {
    for (const value of iterable) {
        if (!predicate(value)) return false;
    }

    return true;
}

export function some<T>(iterable: Iterable<T>, predicate: PredicateCallback<T>): boolean {
    for (const value of iterable) {
        if (predicate(value)) return true;
    }

    return false;
}

export function* filter<T>(iterable: Iterable<T>, predicate: PredicateCallback<T>): IterableIterator<T> {
    for (const value of iterable) {
        if (predicate(value)) yield value;
    }
}

export function* single<T>(value: T): IterableIterator<T> {
    yield value;
}