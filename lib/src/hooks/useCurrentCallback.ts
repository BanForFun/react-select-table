import { useCallback } from 'react';
import useUpdatedRef from './useUpdatedRef';

export default function useCurrentCallback<TArgs extends unknown[], TReturn>(callback: (...args: TArgs) => TReturn) {
    const ref = useUpdatedRef(callback);
    return useCallback((...args: TArgs) => ref.current(...args), [ref]);
}