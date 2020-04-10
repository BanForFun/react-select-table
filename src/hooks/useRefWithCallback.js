import { useRef, useCallback } from "react"

export default function useRefWithCallback(callback) {
    const ref = useRef(null);
    const disposePrevious = useRef();

    const setRef = useCallback(node => {
        if (ref.current) {
            const { current: dispose } = disposePrevious;
            if (typeof dispose !== "function") return;
            dispose();
        }

        ref.current = node;

        if (!node) return;
        disposePrevious.current = callback();
    }, [])

    return [ref, setRef]
}