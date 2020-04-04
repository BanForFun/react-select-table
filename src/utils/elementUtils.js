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