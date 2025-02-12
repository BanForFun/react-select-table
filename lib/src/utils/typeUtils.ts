export type Primitive = string | number | boolean | null | undefined;

export type ObjectKey = string | number | symbol;

export type EmptyObject = Record<string, never>;

export type Tuple = readonly unknown[];


export type StringKeyOf<O extends object> = keyof O & string;

export type PickRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type PickPartial<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export type PickByValue<O, V> = { [K in keyof O as O[K] extends V ? K : never]: O[K] };

export type MaybePromise<T> = T | Promise<T> | PromiseLike<T>;

export type ObjectValue<O extends object> = O[keyof O];

export type PickExisting<T, K> = Pick<T, K & keyof T>;

export type Flatten<T> = { [K in keyof T]: T[K] };

export type OptionalIfPartial<T extends object> = object extends T ? T | undefined : T;

export type PartialByValue<T, D = undefined> = Partial<T> & {
    [K in keyof T as D extends T[K] ? never : K]: T[K]
}

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>
} : T;

const incompatibleKeySymbol = Symbol('incompatibleKey');

export type Incompatible<K extends string> = { [incompatibleKeySymbol]?: K };


export type ActionCallback<T extends Tuple = []> = (...args: T) => void;

export type CreatorCallback<T> = () => T;

export type ConverterCallback<F, T> = (value: F) => T;

export type EqualityComparatorCallback<T> = (a: T, b: T) => boolean;

export type GenericEqualityComparatorCallback = <T>(a: T, b: T) => boolean;

export type TypePredicateCallback<T> = (v: unknown) => v is T;

export type PredicateCallback<T> = (value: T) => boolean;

export type GeneratorPredicateCallback<T> = (value: T) => { done?: boolean, value: boolean }

export type EffectCallback<T extends Tuple = []> = (...args: T) => (void | ActionCallback);

export type ComparatorCallback<T> = (a: T, b: T) => number;


export function nullable<T>(value: T): T | null {
    return value;
}

export function optional<T>(value: T): T | undefined {
    return value;
}

export function isInstance(obj: unknown): obj is object {
    return obj !== null && typeof obj === 'object';
}

export function isDictionary(obj: unknown): obj is object {
    return isInstance(obj) && !Array.isArray(obj);
}