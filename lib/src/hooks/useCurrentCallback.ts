import { useCallback } from 'react';
import useUpdatedRef from './useUpdatedRef';

export default function useCurrentCallback<TArgs extends unknown[], TReturn, TThis>(
    callback: (this: TThis, ...args: TArgs) => TReturn
) {
    const callbackRef = useUpdatedRef(callback);
    return useCallback(function(this: TThis, ...args: TArgs) {
        callbackRef.current.apply(this, args);
    }, [callbackRef]);
}