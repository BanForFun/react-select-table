export function sortTuple(x, y) {
    const max = x > y ? x : y;
    const min = x < y ? x : y;
    return [min, max];
}

export function getDecimalPart(n) {
    return n - Math.trunc(n);
}