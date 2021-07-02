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
