import { useCallback, useMemo, useRef } from 'react';
import Observable from '../models/Observable';
import useRenderEffect from './useRenderEffect';
import { EffectCallback } from '../utils/types';

export interface ElementRef<T> {
    readonly value: T | null;
    readonly set: (value: T | null) => void;
    readonly onChanged: Observable;
    readonly useEffect: (callback: EffectCallback<[T]>) => void;
}

export default function useElementRef<T extends HTMLElement>(): ElementRef<T> {
    const valueRef = useRef<T | null>(null);

    return useMemo(() => {
        const onChanged = new Observable();

        return {
            onChanged,
            get value() {
                return valueRef.current;
            },
            set: (value) => {
                const prev = valueRef.current;
                valueRef.current = value;
                if (value !== prev) onChanged.notify();
            },
            useEffect: (callback) => {
                useRenderEffect(useCallback(() => {
                    const run = () => {
                        if (valueRef.current == null) return;
                        return callback(valueRef.current);
                    };

                    run();
                    return onChanged.addObserver(run);
                }, [callback]));
            }
        };
    }, []);
}