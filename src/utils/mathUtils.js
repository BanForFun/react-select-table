import _ from "lodash";

export function sortTuple(a, b) {
    return [
        a > b ? b : a,
        a > b ? a : b
    ];
}

export function clampOffset(number, lower, offset) {
    return _.clamp(number, lower, lower + offset);
}
