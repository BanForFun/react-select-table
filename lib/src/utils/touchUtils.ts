import Point from '../models/Point';

export function getTouchClientPosition(touch: Touch): Point {
    return new Point(touch.clientX, touch.clientY);
}