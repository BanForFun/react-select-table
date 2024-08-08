export type Primitive = string | number | boolean | null | undefined;

export type PickRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export function cast<F extends T, T>(value: F): T {
    return value;
}