import { ActionCallback, EffectCallback, Tuple } from '../utils/types';
import { useCallback, useRef } from 'react';

export default function useEffectCallback<T extends Tuple>(callback: EffectCallback<T>) {
    const cleanupRef = useRef<ActionCallback | null>(null);

    return useCallback((...args: T) => {
        cleanupRef.current?.();

        const result = callback(...args);
        cleanupRef.current = typeof result === 'function' ? result : null;
    }, [callback]);
}