import { PointLike } from '../types/PointLike';
import { RectLike } from '../types/RectLike';

export default class Rect implements PointLike, RectLike {
    // noinspection JSSuspiciousNameCombination
    constructor(public top: number, public right: number, public bottom: number, public left: number) {

    }

    get x(): number {
        return this.left;
    }

    get y(): number {
        return this.top;
    }

    get height(): number {
        return this.bottom - this.top;
    }

    get width(): number {
        return this.right - this.left;
    }

    offset(point: PointLike) {
        this.left += point.x;
        this.right += point.x;
        this.top += point.y;
        this.bottom += point.y;

        return this;
    }

    subtract(point: PointLike) {
        this.left -= point.x;
        this.right -= point.x;
        this.top -= point.y;
        this.bottom -= point.y;

        return this;
    }

    clone() {
        return new Rect(this.top, this.right, this.bottom, this.left);
    }
}