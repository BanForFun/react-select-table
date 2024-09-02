import { Point } from './pointUtils';

export function getTouchClientPosition(touch: Touch): Point {
    return { x: touch.clientX, y: touch.clientY };
}