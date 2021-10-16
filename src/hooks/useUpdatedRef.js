import { useEffect, useRef } from "react";

export default function useUpdatedRef(value) {
    const valueRef = useRef(value);
    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    return valueRef;
}
