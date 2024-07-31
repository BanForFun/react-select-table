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