import Point from '../models/Point';
import Rect from '../models/Rect';

export interface RelatedElements {
    headerLeft?: HTMLElement;
    headerRight?: HTMLElement;
    headerTop?: HTMLElement;
    headerBottom?: HTMLElement;
}

export interface Rects {
    client: Rect;
    content: Rect;
}

export function getPosition(element: HTMLElement) {
    const { left, top } = element.getBoundingClientRect();
    return new Point(left, top);
}

export function getRelativeRects(element: HTMLElement, relatedElements?: RelatedElements): Rects {
    let left = element.clientLeft;
    let top = element.clientTop;
    let bottom = top + element.clientHeight;
    let right = left + element.clientWidth;

    const client = new Rect(top, right, bottom, left);

    if (relatedElements?.headerTop)
        top += relatedElements.headerTop.offsetHeight;

    if (relatedElements?.headerRight)
        right -= relatedElements.headerRight.offsetWidth;

    if (relatedElements?.headerBottom)
        bottom -= relatedElements.headerBottom.offsetHeight;

    if (relatedElements?.headerLeft)
        left += relatedElements.headerLeft.offsetWidth;

    const content = new Rect(top, right, bottom, left);
    return { client, content };
}