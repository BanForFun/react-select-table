import _ from "lodash";

const getOrSource = (source, path) =>
    path ? _.get(source, path) : source;

const setReplaceValue = (set, oldValue, newValue) => {
    if (set.delete(oldValue))
        set.add(newValue)
}

const setToggleValue = (set, value, exists) => {
    if (exists) set.add(value);
    else set.delete(value);
}

const setAddMany = (set, values) =>
    values.forEach(v => set.add(v))

export default function() {
    _.mixin({
        getOrSource,
        setReplaceValue,
        setToggleValue,
        setAddMany
    })
}
