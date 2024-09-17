export default class Point {
    public x: number;
    public y: number;

    // noinspection JSSuspiciousNameCombination
    constructor(x = 0, y = x) {
        this.x = x;
        this.y = y;
    }

    subtract(point: Point) {
        this.x -= point.x;
        this.y -= point.y;

        return this;
    }

    offset(point: Point) {
        this.x += point.x;
        this.y += point.y;

        return this;
    }

    multiply(point: Point) {
        this.x *= point.x;
        this.y *= point.y;

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

    static distance(a: Point, b: Point) {
        return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
    }
}