export function clamp(num: number, min: number, max: number): number {
    if (min > max) {
        const oldMin = min;
        min = max;
        max = oldMin;
    }

    return Math.min(max, Math.max(min, num));
}

export function inRange(num: number, min: number, max: number): boolean {
    if (min > max) {
        const oldMin = min;
        min = max;
        max = oldMin;
    }

    return num >= min && num <= max;
}