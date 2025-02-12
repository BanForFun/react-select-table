import { GenericEqualityComparatorCallback, isInstance, TypePredicateCallback } from './typeUtils';

export function deepFreeze<T>(obj: T) {
    for (const key in obj) {
        if (isInstance(obj[key]))
            deepFreeze(obj[key]);
    }

    return Object.freeze(obj);
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

export function extract<TObject extends object, TValue>(object: TObject, isValue: TypePredicateCallback<TValue>) {
    const result = {} as Record<keyof TObject, TValue>;

    for (const key in object) {
        if (!isValue(object[key])) continue;
        result[key] = object[key];
    }

    return result;
}

function _isSubset<T extends object>(a: T, b: T, compare: GenericEqualityComparatorCallback) {
    for (const key in a) {
        if (!compare(a[key], b[key])) return false;
    }

    return true;
}

function _isEqual<T>(a: T, b: T, compare: GenericEqualityComparatorCallback) {
    if (a === b)
        return true;

    if (!isInstance(a) || !isInstance(b))
        return false;

    return _isSubset(a, b, compare) && _isSubset(b, a, compare);
}

export function isDeepEqual<T>(a: T, b: T): boolean {
    return _isEqual(a, b, isDeepEqual);
}

export function isShallowEqual<T>(a: T, b: T): boolean {
    return _isEqual(a, b, (a, b) => a === b);
}

export function defaults<
    T extends { [K in keyof S]?: T[K] },
    S extends { [K in keyof S]: T[K] }
>(target: T, source: S) {
    for (const key in source) {
        target[key] ??= source[key];
    }

    return target as T & S;
}

export function patch<
    T extends { [K in keyof S]: T[K] },
    S extends { [K in keyof S]: T[K] }
>(target: T, source: S) {
    for (const key in source) {
        target[key] = source[key];
    }

    return target as T & S;
}