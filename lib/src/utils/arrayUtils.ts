export function remove<T>(array: T[], item: T): boolean {
    const index = array.indexOf(item);
    if (index < 0) return false;

    array.splice(index, 1);
    return true;
}

export function* createIterator<T>(array: T[], start = 0): IterableIterator<T> {
    for (let i = start; i < array.length; i++)
        yield array[i];
}

export function* createReverseIterator<T>(array: T[], start = array.length - 1): IterableIterator<T> {
    for (let i = start; i >= 0; i--)
        yield array[i];
}