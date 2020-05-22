import _ from "lodash";

export function pullFirst(array, item) {
    const index = array.indexOf(item);
    if (index >= 0) array.splice(index, 1);
}

export function areItemsEqual(array1, array2) {
    //Compare lengths
    if (array1.length !== array2.length) return false;
    //Compare items
    return _.isEqual(_.sortBy(array1), _.sortBy(array2))
}

export function inArray(item) {
    return item ? [item] : [];
}