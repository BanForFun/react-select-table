import { Converter, Tuple } from './types';

export function bindPartial<H extends Tuple, T extends Tuple, R>(
    callback: (...args: [...H, ...T]) => R,
    ...headArgs: H
) {
    return (...tailArgs: T) => callback(...headArgs, ...tailArgs);
}

export function convertResult<A extends Tuple, F, T>(
    callback: (...args: A) => F,
    converter: Converter<F, T>
) {
    return (...args: A) => converter(callback(...args));
}