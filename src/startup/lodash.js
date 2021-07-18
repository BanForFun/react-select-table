import _ from "lodash";

const getOrSource = (source, path) =>
    path ? _.get(source, path) : source;

const sign = n =>
    n < 0 || Object.is(n, -0) ? -1 : 1;

const wrapIndex = (index, length) =>
    index >= 0 ? index % length : (index % length + length) % length;

export default function() {
    _.mixin({
        getOrSource,
        wrapIndex,
        sign
    })
}
