import { ActionCallback, Tuple } from '../utils/types';
import { useCallback, useEffect, useRef } from 'react';
import { noop } from '../utils/functionUtils';

export default function useAnimationCallback<TArgs extends Tuple>(callback: ActionCallback<TArgs>) {
    const callbackRef = useRef<ActionCallback<TArgs>>(noop);

    useEffect(() => {
        callbackRef.current = callback;
        return () => {
            callbackRef.current = noop;
        };
    }, [callback]);

    return useCallback((...args: TArgs) => {
        callbackRef.current(...args);
    }, []);
}