import { useMemo } from 'react';
import { createElementRef, ElementRef } from '../utils/refUtils';

export default function useElementRef<T extends HTMLElement>(): ElementRef<T> {
    return useMemo(() => createElementRef(), []);
}