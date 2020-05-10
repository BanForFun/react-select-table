export function touchToMouseEvent(e) {
    const [touch] = e.touches;
    e.clientX = touch.clientX;
    e.clientY = touch.clientY;
}

export function registerListeners(element, map, options = {}) {
    function forEach(method) {
        for (let type in map) {
            const handler = map[type];
            method(type, handler, options);
        }
    }

    forEach(element.addEventListener);
    //Return cleanup method
    return () => forEach(element.removeEventListener);
}