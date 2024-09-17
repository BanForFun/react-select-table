import Point from '../models/Point';

export enum PointerType {
    Mouse,
    Pen,
    Finger,
    Other
}

export interface PointerInfo {
    readonly id: number;
    readonly type: PointerType;
    readonly clientPosition: Point;
}

export function isTouchPointerType(pointerType: PointerType) {
    return pointerType === PointerType.Finger || pointerType === PointerType.Pen;
}

export function getPointerType(e: PointerEvent) {
    switch (e.pointerType) {
        case 'mouse':
            return PointerType.Mouse;
        case 'touch':
            return PointerType.Finger;
        case 'pen':
            return PointerType.Pen;
        default:
            return PointerType.Other;
    }
}

export function getPointerClientPosition(e: PointerEvent): Point {
    return new Point(e.clientX, e.clientY);
}

export function getPointerInfo(e: PointerEvent): PointerInfo {
    return {
        id: e.pointerId,
        type: getPointerType(e),
        clientPosition: getPointerClientPosition(e)
    };
}