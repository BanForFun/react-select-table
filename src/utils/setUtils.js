export function getFirstItem(set) {
    return set.keys().next().value;
}

export function deleteMany(set, keys) {
    for (let key of keys)
        set.delete(key);
}
