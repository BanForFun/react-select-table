import {sortTuple} from "./mathUtils";

export function forRange(a, b, callback) {
    const [start, end] = sortTuple(a, b);

    for (let i = start; i <= end; i++)
        callback(i);
}
