const incompatibleKeySymbol = Symbol('incompatibleKey');


export type Primitive = string | number | boolean | null | undefined;

export type ObjectKey = string | number | symbol;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PickRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type PickPartial<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export type PickByValue<O, V> = { [K in keyof O as O[K] extends V ? K : never]: O[K] };

export type Incompatible<K extends string> = { [incompatibleKeySymbol]?: K };

export type MaybePromise<T> = T | Promise<T> | PromiseLike<T>;

export type PartialDefault<T, D = undefined> = PickPartial<T, keyof PickByValue<T, D>>;

export type OmitStrict<T, K extends keyof T> = Omit<T, K> & NeverKeys<K>;

export type NeverKeys<K extends ObjectKey> = Partial<Record<K, never>>;

export type ObjectValue<O extends object> = O[keyof O];

export type PickExisting<T, K> = Pick<T, K & keyof T>;