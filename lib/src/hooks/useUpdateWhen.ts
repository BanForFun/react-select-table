import Observable from '../models/Observable';
import useForceUpdate from './useForceUpdate';
import { useLayoutEffect } from 'react';
import { Tuple } from '../utils/typeUtils';

export default function useUpdateWhen<T extends Tuple>(observable: Observable<T>) {
    const [update, updated] = useForceUpdate();

    useLayoutEffect(() => {
        return observable.addObserver(update);
    }, [observable, update]);

    return updated;
}