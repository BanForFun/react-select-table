import { GenericComparatorCallback } from './types';

function isObject(obj: unknown): obj is object {
    return obj !== null && typeof obj === 'object';
}

export function deepFreeze<T>(obj: T) {
    for (const key in obj) {
        if (isObject(obj[key]))
            deepFreeze(obj[key]);
    }

    return Object.freeze(obj);
}

export function assignDefaults<
    TObject extends Partial<TSource>,
    TSource extends { [key in keyof TSource]: TObject[key] }
>(object: TObject, source: TSource): TObject & TSource {
    for (const key in source) {
        object[key] ??= source[key];
    }

    return object as TObject & TSource;
}

export function assign<
    TObject extends TSource,
    TSource extends { [key in keyof TSource]: TObject[key] }
>(object: TObject, source: TSource): TObject & TSource {
    for (const key in source) {
        object[key] = source[key];
    }

    return object as TObject & TSource;
}

export function buildObject<T>(builder: (result: Partial<T>) => void) {
    const result = {} as Partial<T>;
    builder(result);

    return result as T;
}

export function mapValues<TSource, TMapped>(
    obj: TSource,
    map: <K extends keyof TSource>(key: K, value: TSource[K]) => TMapped
) {
    const result = {} as Record<keyof TSource, TMapped>;
    for (const key in obj) {
        result[key] = map(key, obj[key]);
    }

    return result;
}

export function mapMethods<TSource extends Record<keyof TSource, (...args: never) => unknown>, TMapped>(
    obj: TSource,
    map: <K extends keyof TSource>(key: K, value: TSource[K]) => (...args: Parameters<TSource[K]>) => TMapped
): { [K in keyof TSource]: ReturnType<typeof map<K>> } {
    return mapValues(obj, map);
}

export function extract<TObject extends object, TValue>(object: TObject, isValue: (v: unknown) => v is TValue) {
    const result = {} as Record<keyof TObject, TValue>;

    for (const key in object) {
        if (!isValue(object[key])) continue;
        result[key] = object[key];
    }

    return result;
}

function _isSubset<T extends object>(a: T, b: T, compare: GenericComparatorCallback) {
    for (const key in a) {
        if (!compare(a[key], b[key])) return false;
    }

    return true;
}

function _isEqual<T>(a: T, b: T, compare: GenericComparatorCallback) {
    if (a === b)
        return true;

    if (typeof a !== 'object' || typeof b !== 'object')
        return false;

    if (a === null || b === null)
        return false;

    return _isSubset(a, b, compare) && _isSubset(b, a, compare);
}

export function isDeepEqual<T>(a: T, b: T): boolean {
    return _isEqual(a, b, isDeepEqual);
}

export function isShallowEqual<T>(a: T, b: T): boolean {
    return _isEqual(a, b, (a, b) => a === b);
}