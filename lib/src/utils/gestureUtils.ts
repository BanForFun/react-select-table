import { EmptyObject } from './types';
import { difference, distance, originPoint, Point } from './pointUtils';
import { getPointerClientPosition, getPointerInfo, PointerInfo, PointerType } from './pointerUtils';
import { addElementEventListener, getAddEventListener } from './eventUtils';
import { getTouchClientPosition } from './touchUtils';
import { all, first } from './iterableUtils';

interface GestureEventArgs {
    leftMouseDown: EmptyObject;
    tap: EmptyObject;
    longTap: EmptyObject;
    dragStart: EmptyObject;
    dragUpdate: { clientPosition: Point, scrollDelta: Point };
    dragEnd: EmptyObject;
    touchContextMenu: EmptyObject;
    mouseContextMenu: EmptyObject;
    contextMenu: EmptyObject;
}

export type GestureEventMap = {
    [K in keyof GestureEventArgs]: CustomEvent<GestureEventArgs[K]>
}

type GestureEventDispatcher = <K extends keyof GestureEventArgs>(name: K, args: GestureEventArgs[K]) => boolean;

interface Gesture {
    readonly replaceTarget: (target: HTMLElement) => Gesture;
}

const longTapDurationMs = 500;
const longTapMarginPx = 5;

let lastEvent: Event | null = null;
let stoppedPropagation = false;
let globalGestures: Gesture[] = [];

function createGestureEventDispatcher(element: HTMLElement): GestureEventDispatcher {
    return (name, args) => element.dispatchEvent(new CustomEvent(name, { detail: args }));
}

function createGestureFactory<T>(
    factory: (arg: T, target: HTMLElement, dispatchEvent: GestureEventDispatcher) => () => void
) {
    const createGesture = (
        arg: T,
        target: HTMLElement,
        dispatchEvent = createGestureEventDispatcher(target)
    ): Gesture => {
        const destructor = factory(arg, target, dispatchEvent);
        return {
            replaceTarget(newTarget) {
                destructor();
                return createGesture(arg, newTarget, dispatchEvent);
            }
        };
    };

    return createGesture;
}

const createMouseDragGesture = createGestureFactory<PointerInfo>((pointer, target, dispatchEvent) => {
    target.setPointerCapture(pointer.id);
    dispatchEvent('dragStart', {});

    const disablePointerMove = addElementEventListener(target, 'pointermove', e => {
        if (e.pointerId !== pointer.id) return;

        const clientPosition = getPointerClientPosition(e);
        dispatchEvent('dragUpdate', {
            clientPosition,
            scrollDelta: originPoint
        });

        pointer.clientPosition = clientPosition;
    });

    const handlePointerLost = (e: PointerEvent) => {
        if (e.pointerId !== pointer.id) return;

        cancel();
        dispatchEvent('dragEnd', {});
    };

    const disablePointerCancel = addElementEventListener(target, 'pointercancel', handlePointerLost);
    const disablePointerUp = addElementEventListener(target, 'pointerup', handlePointerLost);

    const cancel = () => {
        target.releasePointerCapture(pointer.id);

        disablePointerMove();
        disablePointerCancel();
        disablePointerUp();
    };

    return cancel;
});

const createTouchDragGesture = createGestureFactory<Touch>((touch, target, dispatchEvent) => {
    let touchPosition = getTouchClientPosition(touch);
    const scrollTouchPositions = new Map<number, Point>();

    dispatchEvent('dragStart', {});

    const disableTouchStart = addElementEventListener(target, 'touchstart', e => {
        for (const changedTouch of e.changedTouches) {
            scrollTouchPositions.set(changedTouch.identifier, getTouchClientPosition(changedTouch));
        }
    });

    const disableTouchMove = addElementEventListener(target, 'touchmove', e => {
        e.preventDefault();

        const scrollDelta = { x: 0, y: 0 };
        for (const changedTouch of e.changedTouches) {
            if (changedTouch.identifier === touch.identifier) {
                touchPosition = getTouchClientPosition(changedTouch);
                continue;
            }

            const lastPosition = scrollTouchPositions.get(changedTouch.identifier);
            if (lastPosition == null) continue;

            const positionDelta = difference(getTouchClientPosition(changedTouch), lastPosition);
            scrollDelta.x += positionDelta.x;
            scrollDelta.y += positionDelta.y;
        }

        dispatchEvent('dragUpdate', {
            clientPosition: touchPosition,
            scrollDelta: scrollDelta
        });
    });

    const handleTouchLost = (e: TouchEvent) => {
        for (const changedTouch of e.changedTouches) {
            if (changedTouch.identifier === touch.identifier) {
                cancel();
                dispatchEvent('dragEnd', {});
                continue;
            }

            scrollTouchPositions.delete(changedTouch.identifier);
        }
    };

    const disableTouchCancel = addElementEventListener(target, 'touchcancel', handleTouchLost);
    const disableTouchEnd = addElementEventListener(target, 'touchend', handleTouchLost);

    const cancel = () => {
        disableTouchStart();
        disableTouchMove();
        disableTouchCancel();
        disableTouchEnd();
    };

    return cancel;
});

const createLongTapGesture = createGestureFactory<Touch>((touch, target, dispatchEvent) => {
    const disableTouchStart = addElementEventListener(target, 'touchstart', () => {
        cancel();
    });

    const disableTouchMove = addElementEventListener(target, 'touchmove', e => {
        e.preventDefault();

        const updatedTouch = first(e.changedTouches, t => t.identifier === touch.identifier);
        if (updatedTouch == null) return;

        const movedDistance = distance(getTouchClientPosition(updatedTouch), getTouchClientPosition(touch));
        if (movedDistance <= longTapMarginPx) return;

        cancel();
    });

    const handleTouchLost = (e: TouchEvent) => {
        const updatedTouch = first(e.changedTouches, t => t.identifier === touch.identifier);
        if (updatedTouch == null) return;

        cancel();
    };

    const disableTouchCancel = addElementEventListener(target, 'touchcancel', handleTouchLost);
    const disableTouchEnd = addElementEventListener(target, 'touchend', handleTouchLost);

    const timeoutId = setTimeout(() => {
        if (dispatchEvent('longTap', {}))
            createTouchDragGesture(touch, target, dispatchEvent);

        cancel(false);
    }, longTapDurationMs);

    const cancel = (hasTimeout = true) => {
        disableTouchStart();
        disableTouchMove();
        disableTouchCancel();
        disableTouchEnd();

        if (hasTimeout)
            clearTimeout(timeoutId);
    };

    return cancel;
});

export function enableGestures(element: HTMLElement) {
    function forwardEvent<N extends keyof HTMLElementEventMap>(
        name: N,
        listener: (dispatchEvent: GestureEventDispatcher, e: HTMLElementEventMap[N]) => boolean
    ) {
        return addElementEventListener(element, name, e => {
            if (e !== lastEvent) {
                stoppedPropagation = false;
                globalGestures = [];
                lastEvent = e;
            }

            for (let i = 0; i < globalGestures.length; i++) {
                globalGestures[i] = globalGestures[i].replaceTarget(element);
            }

            if (!stoppedPropagation) {
                stoppedPropagation = listener(createGestureEventDispatcher(element), e);
            }
        });
    }

    const disablePointerDown = forwardEvent('pointerdown', (dispatchEvent, e) => {
        const pointer = getPointerInfo(e);
        if (pointer.type === PointerType.Mouse && e.button === 0 && dispatchEvent('leftMouseDown', {}))
            globalGestures.push(createMouseDragGesture(pointer, element));

        return true;
    });

    const disableTouchStart = forwardEvent('touchstart', (dispatchEvent, e) => {
        if (!all(e.touches, t => element.contains(t.target as Element))) return false;

        switch (e.touches.length) {
            case 1:
                if (!dispatchEvent('tap', {})) break;
                globalGestures.push(createLongTapGesture(e.touches.item(0)!, element));
                break;
            case 2:
                dispatchEvent('contextMenu', {});
                dispatchEvent('touchContextMenu', {});
                break;
        }

        return true;
    });

    const disableClick = forwardEvent('click', (dispatchEvent, e) => {
        if (e.button === 2) {
            dispatchEvent('contextMenu', {});
            dispatchEvent('mouseContextMenu', {});
        }

        return true;
    });

    return () => {
        disablePointerDown();
        disableTouchStart();
        disableClick();
    };
}

export const addGestureEventListener = getAddEventListener<GestureEventMap>();