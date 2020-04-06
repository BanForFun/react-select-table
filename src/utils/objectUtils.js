export function deleteKeys(object, keys) {
    for (let key of keys) delete object[key];
}