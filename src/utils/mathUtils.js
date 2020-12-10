export function sortTuple(a, b) {
    return [
        a > b ? b : a,
        a > b ? a : b
    ];
}
