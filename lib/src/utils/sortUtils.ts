import { Primitive } from './types';

export function comparePrimitives(value: Primitive, other: Primitive) {
    if (value === other) return 0;

    if (value === undefined) return 1;
    if (other === undefined) return -1;

    if (value === null) return 1;
    if (other === null) return -1;

    if (typeof value === 'string' && typeof other === 'string')
        return value.localeCompare(other);

    if (value > other) return 1;
    if (value < other) return -1;

    return 0;
}