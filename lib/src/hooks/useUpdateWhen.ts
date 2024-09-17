import Observable from '../models/Observable';
import useForceUpdate from './useForceUpdate';
import { useEffect } from 'react';
import { Tuple } from '../utils/types';


export default function useUpdateWhen<T extends Tuple>(observable: Observable<T>) {
    const [update, updated] = useForceUpdate();

    useEffect(() => {
        return observable.addObserver(update);
    }, [observable, update]);

    return updated;
}