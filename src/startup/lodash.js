import _ from "lodash";

const getOrSource = (source, path) =>
    path ? _.get(source, path) : source;

export default function() {
    _.mixin({
        getOrSource
    })
}
