import { useCallback, useRef } from 'react';

export default function useCurrentCallback<
    TArgs extends unknown[],
    TReturn extends unknown
>(callback: (...args: TArgs) => TReturn) {
    const ref = useRef(callback);
    ref.current = callback;

    return useCallback((...args: TArgs) => ref.current(...args), [ref]);
}