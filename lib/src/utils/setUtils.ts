export function tryAdd<T>(set: Set<T>, value: T): boolean {
    if (set.has(value)) return false;

    set.add(value);
    return true;
}