import Point from './Point';
import { GestureTarget } from '../utils/gestureUtils';
import { RelatedElements } from '../utils/elementUtils';

export interface BaseEventArgs {
    target: HTMLElement;
    relatedTargets: RelatedElements;
}

export interface ModifierEventArgs {
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
}

export interface DragStartEventArgs {
    clientPosition: Point;
}

export interface DragUpdateEventArgs {
    clientPosition: Point;
    panDelta: Point;
}

export default class GestureEventArgBuilder<T extends BaseEventArgs> {
    private constructor(private args: T) {

    }

    private _with<E>(extra: E) {
        Object.assign(this.args, extra);
        return this as unknown as GestureEventArgBuilder<E & T>;
    }

    addModifiers(e: ModifierEventArgs) {
        return this._with<ModifierEventArgs>({
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey
        });
    }

    addDragStart(clientPosition: Point) {
        return this._with<DragStartEventArgs>({
            clientPosition
        });
    }

    addDragUpdate(clientPosition: Point, panDelta: Point = new Point()) {
        return this._with<DragUpdateEventArgs>({
            clientPosition,
            panDelta
        });
    }

    render() {
        return this.args;
    }

    static create(target: GestureTarget) {
        return new GestureEventArgBuilder({
            target: target.element,
            relatedTargets: target.relatedElements ?? {}
        });
    }
}