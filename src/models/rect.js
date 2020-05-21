import { sortTuple } from "../utils/mathUtils";

export default class Rect {
    left = 0;
    top = 0;
    right = 0;
    bottom = 0;

    static fromPoints(x1, y1, x2, y2) {
        const [left, right] = sortTuple(x1, x2);
        const [top, bottom] = sortTuple(y1, y2);

        return new Rect(left, top, right, bottom);
    }

    static fromPosSize(x, y, width, height) {
        const right = x + width;
        const bottom = y + height;

        return new Rect(x, y, right, bottom);
    }

    constructor(left, top, right, bottom) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }

    offsetBy(x, y) {
        this.left += x;
        this.right += x;
        this.top += y;
        this.bottom += y;
    }

    limit(rect) {
        this.left = Math.max(this.left, rect.left);
        this.top = Math.max(this.top, rect.top);
        this.right = Math.min(this.right, rect.right);
        this.bottom = Math.min(this.bottom, rect.bottom);
    }

    get x() {
        return this.left;
    }

    get y() {
        return this.top;
    }

    get width() {
        return this.right - this.left;
    }

    get height() {
        return this.bottom - this.top;
    }
}