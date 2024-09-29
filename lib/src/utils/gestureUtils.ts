import Point from '../models/Point';
import { getPointerClientPosition, getPointerInfo, PointerInfo, PointerType } from './pointerUtils';
import { getTouchClientPosition } from './touchUtils';
import { all, first } from './iterableUtils';
import { createElementEventManager, elementEventManager } from './eventUtils';
import GestureEventArgBuilder, {
    BaseEventArgs,
    DragStartEventArgs,
    DragUpdateEventArgs,
    ModifierEventArgs
} from '../models/GestureEventArgBuilder';
import { getOffsetRelativeRects, RelatedElements } from './elementUtils';

interface GestureEventArgs {
    tap: BaseEventArgs;
    dualTap: BaseEventArgs;
    shortTap: BaseEventArgs;
    longTap: BaseEventArgs;
    leftMouseDown: BaseEventArgs & ModifierEventArgs;
    dragStart: BaseEventArgs & DragStartEventArgs;
    dragUpdate: BaseEventArgs & ModifierEventArgs & DragUpdateEventArgs;
    dragEnd: BaseEventArgs;
    rightMouseDown: BaseEventArgs & ModifierEventArgs;
    leftMouseClick: BaseEventArgs & ModifierEventArgs;
}

export interface GestureTarget {
    readonly element: HTMLElement;
    relatedElements?: RelatedElements;
    rotateScroll?: boolean;
    enableDrag?: boolean;
}

export type GestureEventMap = {
    [K in keyof GestureEventArgs]: CustomEvent<GestureEventArgs[K]>
}

interface Gesture {
    readonly replaceTarget: (target: GestureTarget) => Gesture;
}

const longTapDurationMs = 500;
const movementMarginPx = 5;

let lastEvent: Event | null = null;
let stoppedPropagation = false;
let globalGestures: Gesture[] = [];

function dispatchEvent<K extends keyof GestureEventArgs>(
    element: HTMLElement,
    name: K,
    args: GestureEventArgs[K]
) {
    return element.dispatchEvent(new CustomEvent(name, {
        detail: args,
        bubbles: true,
        cancelable: true
    }));
}

function createGestureFactory<T>(factory: (e: T, currentTarget: GestureTarget, target: GestureTarget) => () => void) {
    const createGesture = (e: T, currentTarget: GestureTarget, target = currentTarget): Gesture => {
        const destructor = factory(e, currentTarget, target);
        return {
            replaceTarget(newTarget) {
                destructor();
                return createGesture(e, newTarget, target);
            }
        };
    };

    return createGesture;
}

const createLeftMouseDownGesture = createGestureFactory<PointerInfo>((pointer, currentTarget, target) => {
    const initialPointerPosition = pointer.clientPosition;
    let pointerPosition = initialPointerPosition;

    let isStarted = false;
    const startDrag = () => {
        dispatchEvent(target.element, 'dragStart', GestureEventArgBuilder.create(currentTarget)
            .addDragStart(initialPointerPosition)
            .render());
        isStarted = true;
    };

    target.element.setPointerCapture(pointer.id);
    const eventGroup = elementEventManager.createGroup();

    eventGroup.addListener(currentTarget.element, 'wheel', e => {
        const panDelta = new Point(e.deltaY, e.deltaX);
        if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
            panDelta.multiply(new Point(parseInt(getComputedStyle(currentTarget.element).lineHeight)));
        } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
            panDelta.multiply(getOffsetRelativeRects(currentTarget.element, currentTarget.relatedElements).content);
        }

        if (e.shiftKey !== !!target.rotateScroll)
            panDelta.rotate();

        if (!isStarted) {
            if (!target.enableDrag) return;
            startDrag();
        }

        e.preventDefault();

        dispatchEvent(target.element, 'dragUpdate', GestureEventArgBuilder.create(currentTarget)
            .addModifiers(e)
            .addDragUpdate(pointerPosition, panDelta)
            .render());
    });

    eventGroup.addListener(currentTarget.element, 'pointermove', e => {
        if (e.pointerId !== pointer.id) return;

        pointerPosition = getPointerClientPosition(e);
        if (!isStarted && Point.distance(pointerPosition, initialPointerPosition) > movementMarginPx) {
            if (!target.enableDrag) return cancel();
            startDrag();
        }

        if (!isStarted) return;

        dispatchEvent(target.element, 'dragUpdate', GestureEventArgBuilder.create(currentTarget)
            .addModifiers(e)
            .addDragUpdate(pointerPosition)
            .render());
    });

    const handlePointerLost = (e: PointerEvent): boolean => {
        if (e.pointerId !== pointer.id) return false;

        if (isStarted) {
            dispatchEvent(target.element, 'dragEnd', GestureEventArgBuilder.create(currentTarget).render());
        }

        cancel();
        return true;
    };

    eventGroup.addListener(currentTarget.element, 'pointercancel', handlePointerLost);
    eventGroup.addListener(currentTarget.element, 'pointerup', e => {
        if (!handlePointerLost(e)) return;

        if (!isStarted) {
            dispatchEvent(target.element, 'leftMouseClick', GestureEventArgBuilder.create(currentTarget)
                .addModifiers(e)
                .render());
        }
    });

    const cancel = () => {
        target.element.releasePointerCapture(pointer.id);
        eventGroup.removeAllListeners();
    };

    return cancel;
});

const createTouchDragGesture = createGestureFactory<Touch>((touch, currentTarget, target) => {
    const initialTouchPosition = getTouchClientPosition(touch);
    let touchPosition = initialTouchPosition;
    const scrollTouchPositions = new Map<number, Point>();

    let isStarted = false;
    const startDrag = () => {
        dispatchEvent(target.element, 'dragStart', GestureEventArgBuilder.create(currentTarget)
            .addDragStart(initialTouchPosition)
            .render());

        isStarted = true;
    };

    const eventGroup = elementEventManager.createGroup();

    eventGroup.addListener(currentTarget.element, 'touchstart', e => {
        for (const changedTouch of e.changedTouches) {
            scrollTouchPositions.set(changedTouch.identifier, getTouchClientPosition(changedTouch));
        }
    });

    eventGroup.addListener(currentTarget.element, 'touchmove', e => {
        e.preventDefault();

        const panDelta = new Point();
        for (const changedTouch of e.changedTouches) {
            if (changedTouch.identifier === touch.identifier) {
                touchPosition = getTouchClientPosition(changedTouch);

                if (!isStarted && Point.distance(touchPosition, initialTouchPosition) > movementMarginPx)
                    startDrag();

                continue;
            }

            const lastPosition = scrollTouchPositions.get(changedTouch.identifier);
            if (lastPosition == null) continue;

            const touchMovement = getTouchClientPosition(changedTouch).subtract(lastPosition);
            panDelta.offset(touchMovement);

            if (!isStarted)
                startDrag();
        }

        if (!isStarted) return;

        dispatchEvent(target.element, 'dragUpdate', GestureEventArgBuilder.create(currentTarget)
            .addModifiers(e)
            .addDragUpdate(touchPosition, panDelta)
            .render());
    });

    const handleTouchLost = (e: TouchEvent) => {
        for (const changedTouch of e.changedTouches) {
            if (changedTouch.identifier !== touch.identifier) {
                scrollTouchPositions.delete(changedTouch.identifier);
                continue;
            }

            if (isStarted)
                dispatchEvent(target.element, 'dragEnd', GestureEventArgBuilder.create(currentTarget).render());

            cancel();
        }
    };

    eventGroup.addListener(currentTarget.element, 'touchcancel', handleTouchLost);
    eventGroup.addListener(currentTarget.element, 'touchend', handleTouchLost);

    const cancel = () => {
        eventGroup.removeAllListeners();
    };

    return cancel;
});

const createTapGesture = createGestureFactory<Touch>((touch, currentTarget, target) => {
    const eventGroup = elementEventManager.createGroup();

    eventGroup.addListener(currentTarget.element, 'touchstart', () => {
        cancel();
    });

    eventGroup.addListener(currentTarget.element, 'touchmove', e => {
        e.preventDefault();

        const updatedTouch = first(e.changedTouches, t => t.identifier === touch.identifier);
        if (updatedTouch == null) return;

        const movedDistance = Point.distance(getTouchClientPosition(updatedTouch), getTouchClientPosition(touch));
        if (movedDistance > movementMarginPx) cancel();
    });

    const handleTouchLost = (e: TouchEvent): boolean => {
        const updatedTouch = first(e.changedTouches, t => t.identifier === touch.identifier);
        if (updatedTouch == null) return false;

        cancel();
        return true;
    };

    eventGroup.addListener(currentTarget.element, 'touchcancel', handleTouchLost);
    eventGroup.addListener(currentTarget.element, 'touchend', e => {
        if (!handleTouchLost(e)) return;
        dispatchEvent(target.element, 'shortTap', GestureEventArgBuilder.create(currentTarget).render());
    });

    const timeoutId = setTimeout(() => {
        if (
            dispatchEvent(target.element, 'longTap', GestureEventArgBuilder.create(currentTarget).render())
            && target.enableDrag
        ) {
            createTouchDragGesture(touch, currentTarget, target);
        }

        cancel(false);
    }, longTapDurationMs);

    const cancel = (hasTimeout = true) => {
        eventGroup.removeAllListeners();

        if (hasTimeout)
            clearTimeout(timeoutId);
    };

    return cancel;
});

export function enableGestures(target: GestureTarget) {
    const eventGroup = elementEventManager.createGroup();

    function registerEventForwarder<N extends keyof HTMLElementEventMap>(
        name: N,
        listener: (e: HTMLElementEventMap[N]) => boolean
    ) {
        eventGroup.addListener(target.element, name, e => {
            if (e !== lastEvent) {
                stoppedPropagation = false;
                globalGestures = [];
                lastEvent = e;
            }

            for (let i = 0; i < globalGestures.length; i++) {
                globalGestures[i] = globalGestures[i].replaceTarget(target);
            }

            if (!stoppedPropagation) {
                stoppedPropagation = listener(e);
            }
        });
    }

    registerEventForwarder('pointerdown', (e) => {
        const pointer = getPointerInfo(e);
        if (pointer.type !== PointerType.Mouse) return true;

        if (e.button === 2) {
            dispatchEvent(target.element, 'rightMouseDown', GestureEventArgBuilder.create(target)
                .addModifiers(e)
                .render());
        } else if (
            e.button === 0
            && dispatchEvent(target.element, 'leftMouseDown', GestureEventArgBuilder.create(target)
                .addModifiers(e)
                .render())
        ) {
            globalGestures.push(createLeftMouseDownGesture(pointer, target));
        }

        return true;
    });

    registerEventForwarder('touchstart', (e) => {
        if (!all(e.touches, t => target.element.contains(t.target as Element))) return false;

        switch (e.touches.length) {
            case 1:
                if (!dispatchEvent(target.element, 'tap', GestureEventArgBuilder.create(target).render())) break;
                globalGestures.push(createTapGesture(e.touches.item(0)!, target));
                break;
            case 2:
                dispatchEvent(target.element, 'dualTap', GestureEventArgBuilder.create(target).render());
                break;
        }

        return true;
    });

    return () => eventGroup.removeAllListeners();
}

export const gestureEventManager = createElementEventManager<HTMLElement, GestureEventMap>();