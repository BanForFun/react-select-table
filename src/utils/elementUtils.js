export function registerEventListeners(element, map) {
    function forEach(methodName) {
        for (let type in map) {
            const handler = map[type];
            element[methodName](type, handler);
        }
    }

    forEach("addEventListener")
    //Return cleanup method
    return function () {
        forEach("removeEventListener")
    }
}

export function isOverflowed(element) {
    if (!element) return false;

    return element.offsetHeight < element.scrollHeight ||
        element.offsetWidth < element.scrollWidth;
}