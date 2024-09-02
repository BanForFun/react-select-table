import { useRef } from 'react';
import { isEqual } from '../utils/objectUtils';

export default function useDeepMemo<T>(value: T) {
    const valueRef = useRef<T>(value);
    if (!isEqual(value, valueRef.current))
        valueRef.current = value;

    return valueRef.current;
}