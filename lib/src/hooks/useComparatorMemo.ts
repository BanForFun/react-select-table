import { useRef } from 'react';
import { EqualityComparatorCallback } from '../utils/typeUtils';

export default function useComparatorMemo<T>(value: T, comparator: EqualityComparatorCallback<T>) {
    const valueRef = useRef<T>(value);
    if (!comparator(value, valueRef.current))
        valueRef.current = value;

    return valueRef.current;
}