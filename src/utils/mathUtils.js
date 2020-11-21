import _ from "lodash";

export function sortTuple(a, b) {
    const max = a > b ? a : b;
    const min = a < b ? a : b;
    return [min, max];
}

export function clampOffset(number, lower, offset) {
    return _.clamp(number, lower, lower + offset);
}
