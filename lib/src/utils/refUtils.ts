import React, { useCallback, useLayoutEffect } from 'react';
import Observable from '../models/Observable';
import { EffectCallback } from './types';
import useEffectCallback from '../hooks/useEffectCallback';

export interface ElementRef<T extends HTMLElement = HTMLElement> {
    readonly element: T;
    readonly isInitialized: boolean;
    readonly set: (value: T | null) => void;
    readonly onChanged: Observable;
    readonly useEffect: (callback: EffectCallback<[T]>) => void;
}

export function createElementRef<T extends HTMLElement>(): ElementRef<T> {
    const onChanged = new Observable();
    let element: T | null = null;

    return {
        onChanged,
        get isInitialized() {
            return element != null;
        },
        get element() {
            if (element == null)
                throw new Error('Element is not initialized');

            return element;
        },
        set: (value) => {
            const prev = element;
            element = value;
            if (value !== prev) onChanged.notify();
        },
        useEffect: (callback) => {
            const effectCallback = useEffectCallback(useCallback(() => {
                if (element == null) return;
                return callback(element);
            }, [callback]));

            useLayoutEffect(() => {
                effectCallback();
                return onChanged.addObserver(effectCallback);
            }, [effectCallback]);
        }
    };
}

export function distributeRef<T>(...refs: React.ForwardedRef<T>[]) {
    return (value: T | null) => {
        for (const ref of refs) {
            refSetter(ref)?.(value);
        }
    };
}

export function refSetter<T>(ref: React.ForwardedRef<T>) {
    if (ref == null) return null;

    if (typeof ref === 'function')
        return ref;

    return (value: T | null) => {
        ref.current = value;
    };
}