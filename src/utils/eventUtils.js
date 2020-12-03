export function matchModifiers(e, ctrl = false, shift = false, alt = false) {
    function match(value, target) {
        if (target === null) return true;
        return value === target;
    }

    return match(e.ctrlKey, ctrl) &&
        match(e.shiftKey, shift) &&
        match(e.altKey, alt);
}
