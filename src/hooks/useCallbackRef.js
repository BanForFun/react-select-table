import { useRef, useCallback } from 'react';

export default function useCallbackRef(callback) {
    const disposeRef = useRef(null);
    return useCallback((node) => {
        if (disposeRef.current) {
            disposeRef.current();
            disposeRef.current = null;
        }

        if (node) {
            disposeRef.current = callback(node);
        }
    }, [callback]);
}
