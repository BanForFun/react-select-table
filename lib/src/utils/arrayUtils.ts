export function remove<T>(array: T[], item: T): boolean {
    const index = array.indexOf(item);
    if (index < 0) return false;

    array.splice(index, 1);
    return true;
}

export function* createReverseIterator<T>(array: T[]): IterableIterator<T> {
    for (let i = array.length - 1; i >= 0; i--)
        yield array[i];
}