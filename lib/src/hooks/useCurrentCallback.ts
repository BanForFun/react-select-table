import { useCallback } from 'react';
import useUpdatedRef from './useUpdatedRef';

export default function useCurrentCallback<TArgs extends unknown[], TReturn, TThis>(
    callback: (this: TThis, ...args: TArgs) => TReturn
) {
    const ref = useUpdatedRef(callback);
    return useCallback(function(this: TThis, ...args: TArgs) {
        ref.current.apply(this, args);
    }, [ref]);
}