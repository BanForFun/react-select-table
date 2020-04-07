import _ from "lodash";

export function pullFirst(array, item) {
    const index = array.indexOf(item);
    if (index >= 0) array.splice(index, 1);
}

export function areArraysEqual(array1, array2) {
    return _.isEqual(_.sortBy(array1), _.sortBy(array2))
}

export function encloseInArray(item) {
    if (!item) return [];
    return [item];
}