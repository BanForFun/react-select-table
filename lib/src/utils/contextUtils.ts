import { Context, createContext } from 'react';

export type RequiredContext<T> = Context<T | null>;

export function createRequiredContext<T>(): RequiredContext<T> {
    return createContext<T | null>(null);
}