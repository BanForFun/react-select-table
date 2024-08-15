const incompatibleKeySymbol = Symbol('incompatibleKey');


export type Primitive = string | number | boolean | null | undefined;

export type ObjectKey = string | number | symbol;

export type PickRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type PickPartial<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export type PickByValue<O, V> = { [K in keyof O as O[K] extends V ? K : never]: O[K] };

export type Incompatible<K extends string> = { [incompatibleKeySymbol]?: K };

export type MaybePromise<T> = T | Promise<T> | PromiseLike<T>;

export type OmitStrict<T, K extends keyof T> = Omit<T, K> & NeverKeys<K>;

export type NeverKeys<K extends ObjectKey = string> = Partial<Record<K, never>>;

export type ObjectValue<O extends object> = O[keyof O];

export type PickExisting<T, K> = Pick<T, K & keyof T>;

export type PartialByValue<T, D = undefined> = Partial<T> & {
    [K in keyof T as D extends T[K] ? never : K]: T[K]
}