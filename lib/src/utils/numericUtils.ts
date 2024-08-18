export function clamp(num: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, num));
}