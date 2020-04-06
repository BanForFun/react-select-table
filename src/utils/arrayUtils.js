export function pullFirst(array, item) {
    const index = array.indexOf(item);
    if (index >= 0)
        delete array[index];
}

export function encloseInArray(item) {
    if (!item) return [];
    return [item];
}