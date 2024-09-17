import { useRef } from 'react';
import { ComparatorCallback } from '../utils/types';

export default function useComparatorMemo<T>(value: T, comparator: ComparatorCallback<T>) {
    const valueRef = useRef<T>(value);
    if (!comparator(value, valueRef.current))
        valueRef.current = value;

    return valueRef.current;
}