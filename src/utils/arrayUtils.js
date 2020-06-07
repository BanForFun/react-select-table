import _ from "lodash";

export function pullFirst(array, item) {
    const index = array.indexOf(item);
    if (index >= 0) array.splice(index, 1);
}

export function areItemsEqual(first, second) {
    //Compare references
    if (first === second) return true;

    //Compare lengths
    if (first.length !== second.length) return false;

    //Compare items
    return _.isEqual(_.sortBy(first), _.sortBy(second))
}

export function inArray(item) {
    return item === null ? [] : [item];
}