import { ActionCallback } from '../utils/types';
import { useRef } from 'react';

export default function useConstant<T>(create: ActionCallback<T>) {
    const valueRef = useRef<T>();
    valueRef.current ??= create();

    return valueRef.current;
}