export function unit(value: number | undefined, unit: string) {
    if (value == null) return '';
    return value + unit;
}