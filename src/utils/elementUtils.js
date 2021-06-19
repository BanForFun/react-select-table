export function boolAttribute(value) {
    return value ? "" : null;
}

export function setBoolAttribute(element, key, value) {
    const { dataset } = element;

    if (value)
        dataset[key] = "";
    else
        delete dataset[key];
}
