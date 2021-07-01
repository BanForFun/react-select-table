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

export function matchEventModifiers(e, ctrl = null, shift = null, alt = null) {
    function match(value, target) {
        if (target === null) return true;
        return value === target;
    }

    return match(e.ctrlKey, ctrl) &&
        match(e.shiftKey, shift) &&
        match(e.altKey, alt);
}

export const unFocusable = {
    tabIndex: -1,
    onMouseDown: e => e.preventDefault()
}
