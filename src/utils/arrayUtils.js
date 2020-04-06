export function pullFirst(array, item) {
    const index = array.indexOf(item);
    if (index >= 0)
        delete array[index];
}