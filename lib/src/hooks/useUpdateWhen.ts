import Observable from '../models/Observable';
import useForceUpdate from './useForceUpdate';
import { useEffect } from 'react';


export default function useUpdateWhen<T>(observable: Observable<T>) {
    const [update, updated] = useForceUpdate();

    useEffect(() => {
        return observable.addObserver(update);
    }, [observable, update]);

    return updated;
}