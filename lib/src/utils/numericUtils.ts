export function clamp(num: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, num));
}

export function inRange(num: number, min: number, max: number): boolean {
    return num >= min && num <= max;
}