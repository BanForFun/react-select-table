import { PointLike } from '../types/PointLike';
import { RectLike } from '../types/RectLike';
import { clamp } from '../utils/numericUtils';

export default class Point implements PointLike {
    // noinspection JSSuspiciousNameCombination
    constructor(public x = 0, public y = x) {
        this.x = x;
        this.y = y;
    }

    get isZero() {
        return this.x === 0 && this.y === 0;
    }

    subtract(point: PointLike) {
        this.x -= point.x;
        this.y -= point.y;

        return this;
    }

    offset(point: PointLike) {
        this.x += point.x;
        this.y += point.y;

        return this;
    }

    multiply(point: PointLike) {
        this.x *= point.x;
        this.y *= point.y;

        return this;
    }

    clamp(rect: RectLike) {
        this.x = clamp(this.x, rect.left, rect.right);
        this.y = clamp(this.y, rect.top, rect.bottom);

        return this;
    }

    round() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        return this;
    }

    rotate() {
        const oldX = this.x;
        // noinspection JSSuspiciousNameCombination
        this.x = this.y;
        // noinspection JSSuspiciousNameCombination
        this.y = oldX;

        return this;
    }

    clone() {
        return new Point(this.x, this.y);
    }

    static distance(a: PointLike, b: PointLike) {
        return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
    }
}