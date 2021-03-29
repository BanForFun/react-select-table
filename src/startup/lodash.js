import _ from "lodash";

const sortTuple = (x, y) => [
    x < y ? x : y,
    x > y ? x : y
]

const forRange = (x, y, callback) => {
    const [start, end] = sortTuple(x, y);
    for (let i = start; i <= end; i++)
        callback(i);
}

const getOrSource = (source, path) =>
    path ? _.get(source, path) : source;

const replaceSetValue = (set, oldValue, newValue) => {
    if (set.delete(oldValue))
        set.add(newValue)
}

const toggleSetValue = (set, value, exists) => {
    if (exists) set.add(value);
    else set.delete(value);
}

const inRangeRelative = (n, start, endOffset) =>
    _.inRange(n, start, start + endOffset);

export default function() {
    _.mixin({
        sortTuple,
        forRange,
        getOrSource,
        replaceSetValue,
        toggleSetValue,
        inRangeRelative
    })
}
