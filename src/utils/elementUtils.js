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

export function ensureRowVisible(item, list) {
    const lowestYVisible = list.scrollTop + list.clientHeight;
    const lowestYHighlighted = item.offsetTop + item.scrollHeight;

    const scrollDown = lowestYVisible < lowestYHighlighted;
    const scrollUp = item.offsetTop < list.scrollTop;

    if (scrollDown) {
        const itemOffsetBottom = item.offsetTop + item.scrollHeight;
        const scrollPos = itemOffsetBottom - list.clientHeight;
        list.scrollTop = scrollPos;
    } else if (scrollUp)
        list.scrollTop = item.offsetTop;
}

export function ensurePosVisible(element, clientX, clientY) {
    const bounds = element.getBoundingClientRect();

    //X
    const offsetRight = clientX - bounds.right;
    const offsetLeft = clientX - bounds.left;

    if (offsetRight > 0)
        element.scrollLeft += offsetRight;
    else if (offsetLeft < 0)
        element.scrollLeft += offsetLeft;


    //Y
    const offsetDown = clientY - bounds.bottom;
    const offsetUp = clientY - bounds.top;

    if (offsetDown > 0)
        element.scrollTop += offsetDown;
    else if (offsetUp < 0)
        element.scrollTop += offsetUp;
}
