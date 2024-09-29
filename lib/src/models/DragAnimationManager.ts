import { GestureEventMap } from '../utils/gestureUtils';
import Point from './Point';
import { getOffsetPosition, getOffsetRelativeRects, RelatedElements } from '../utils/elementUtils';

export type AnimateCallback = (relativePosition: Point, panDelta: Point, scrollDelta: Point) => void;
export type CancelCallback = () => void;

export default class DragAnimationManager {
    private _clientPosition: Point;
    private _target: HTMLElement;
    private _relatedTargets: RelatedElements;
    private _panDelta: Point;

    private _lastTimestamp: number | null = null;
    private _cancelCallback: CancelCallback | null = null;

    constructor(e: GestureEventMap['dragStart'], private _animateCallback: AnimateCallback) {
        this._clientPosition = e.detail.clientPosition;
        this._target = e.detail.target;
        this._relatedTargets = e.detail.relatedTargets;
        this._panDelta = new Point();

        this._requestAnimationFrame();
    }

    private _requestAnimationFrame() {
        requestAnimationFrame(t => this._animate(t));
    }

    private _animate(timestamp: number) {
        const rects = getOffsetRelativeRects(this._target, this._relatedTargets);

        const offsetPosition = getOffsetPosition(this._target);
        rects.content.offset(offsetPosition);
        rects.client.offset(offsetPosition);

        const scrollPosition = new Point(this._target.scrollLeft, this._target.scrollTop);
        const relativePosition = this._clientPosition.clone()
            .clamp(rects.content)
            .subtract(rects.client)
            .offset(scrollPosition);

        const scrollLeft = Math.min(0, this._clientPosition.x - rects.content.left);
        const scrollRight = Math.max(0, this._clientPosition.x - rects.content.right);
        const scrollTop = Math.min(0, this._clientPosition.y - rects.content.top);
        const scrollBottom = Math.max(0, this._clientPosition.y - rects.content.bottom);

        const scrollDelta = new Point(scrollLeft + scrollRight, scrollTop + scrollBottom);

        const rate = this._lastTimestamp != null ? (timestamp - this._lastTimestamp) / 1000 : 0;
        scrollDelta.multiply(new Point(rate));

        this._animateCallback(relativePosition, this._panDelta, scrollDelta);

        this._panDelta = new Point();
        this._lastTimestamp = timestamp;

        if (this._cancelCallback) {
            this._cancelCallback();
            return;
        }

        this._requestAnimationFrame();
    }

    update(e: GestureEventMap['dragUpdate']) {
        this._clientPosition = e.detail.clientPosition;
        this._target = e.detail.target;
        this._relatedTargets = e.detail.relatedTargets;
        this._panDelta.offset(e.detail.panDelta);
    }

    cancel(callback: CancelCallback) {
        this._cancelCallback = callback;
    }
}