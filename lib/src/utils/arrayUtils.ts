export function remove<T>(array: T[], item: T): boolean {
    const index = array.indexOf(item);
    if (index < 0) return false;

    array.splice(index, 1);
    return true;
}

export function pushReverse<T>(dest: T[], source: T[]) {
    for (let i = source.length - 1; i >= 0; i--) {
        dest.push(source[i]);
    }
}