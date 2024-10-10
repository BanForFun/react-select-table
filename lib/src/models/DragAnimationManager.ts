import { GestureEventMap } from '../utils/gestureUtils';
import Point from './Point';
import { getPosition, getRelativeRects, RelatedElements, Rects } from '../utils/elementUtils';

export interface AnimationParams {
    relativePosition: Point;
    absoluteRects: Rects;
    scrollDelta: Point;
    target: HTMLElement;
}

export type AnimateCallback = (params: AnimationParams) => void;
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
        const rects = getRelativeRects(this._target, this._relatedTargets);

        const offsetPosition = getPosition(this._target);
        rects.content.offset(offsetPosition);
        rects.client.offset(offsetPosition);

        const relativePosition = this._clientPosition.clone()
            .clamp(rects.content)
            .subtract(rects.client);

        const scrollLeft = Math.min(0, this._clientPosition.x - rects.content.left);
        const scrollRight = Math.max(0, this._clientPosition.x - rects.content.right);
        const scrollTop = Math.min(0, this._clientPosition.y - rects.content.top);
        const scrollBottom = Math.max(0, this._clientPosition.y - rects.content.bottom);

        const scrollDelta = new Point(scrollLeft + scrollRight, scrollTop + scrollBottom);
        const rate = this._lastTimestamp != null ? (timestamp - this._lastTimestamp) / 100 : 0;
        scrollDelta
            .multiply(new Point(rate))
            .offset(this._panDelta)
            .round();

        this._animateCallback({
            relativePosition,
            scrollDelta,
            absoluteRects: rects,
            target: this._target
        });

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