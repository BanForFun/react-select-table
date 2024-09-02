export interface Point {
    readonly x: number;
    readonly y: number;
}

export function distance(a: Point, b: Point): number {
    return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}

export function difference(a: Point, b: Point): Point {
    return { x: a.x - b.x, y: a.y - b.y };
}

export const originPoint: Point = { x: 0, y: 0 };