import { useCallback, useRef } from 'react';
import { ActionCallback, EffectCallback } from '../utils/types';

const noopEffect = () => undefined;

export default function useRenderEffect(callback: EffectCallback) {
    const cleanupRef = useRef<ActionCallback | null>();
    const callbackRef = useRef<EffectCallback>(noopEffect);

    const runEffect = useCallback(() => {
        cleanupRef.current?.();

        const result = callbackRef.current();
        cleanupRef.current = typeof result === 'function' ? result : null;
    }, [cleanupRef, callbackRef]);

    if (callback !== callbackRef.current) {
        callbackRef.current = callback;
        runEffect();
    }

    return runEffect;
}