import _ from "lodash";

const getOrSource = (source, path) =>
    path ? _.get(source, path) : source;

const wrapIndex = (index, length) =>
    ((index % length) + length) % length;

export default function() {
    _.mixin({
        getOrSource,
        wrapIndex
    });
}
