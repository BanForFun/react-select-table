import _ from "lodash";

export function deleteKeys(object, keys) {
    for (let key of keys) delete object[key];
}

export function isPropEqual(object1, object2, propPath) {
    return _.get(object1, propPath) === _.get(object2, propPath);
}