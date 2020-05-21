import Rect from "../models/rect";

export function ensureRowVisible(item, parent) {
    const lowestYVisible = parent.scrollTop + parent.clientHeight;
    const lowestYHighlighted = item.offsetTop + item.scrollHeight;

    const scrollDown = lowestYVisible < lowestYHighlighted;
    const scrollUp = item.offsetTop < parent.scrollTop;

    if (scrollDown)
        parent.scrollTop = lowestYHighlighted - parent.clientHeight;
    else if (scrollUp)
        parent.scrollTop = item.offsetTop;
}

export function ensurePosVisible(element, clientX, clientY) {
    const { x, y } = element.getBoundingClientRect();
    const { clientWidth, clientHeight } = element;
    const bounds = Rect.fromPosSize(x, y, clientWidth, clientHeight);

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
