export function pullFirst(array, item) {
    const index = array.indexOf(item);
    if (index >= 0) array.splice(index, 1);
}

export function encloseInArray(item) {
    if (!item) return [];
    return [item];
}