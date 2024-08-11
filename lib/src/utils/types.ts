const incompatibleKeySymbol = Symbol('incompatibleKey');


export type Primitive = string | number | boolean | null | undefined;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PickRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type PickOptional<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export type Incompatible<K extends string> = { [incompatibleKeySymbol]?: K };