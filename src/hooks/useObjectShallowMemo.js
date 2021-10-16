import { useRef } from "react";

export default function useObjectShallowMemo(obj) {
    const prevRef = useRef(obj);
    const prev = prevRef.current;

    if (prev === obj) return prev; // This is true on the first call

    for (const prop in obj)
        if (obj[prop] !== prev[prop]) return (prevRef.current = obj);

    return prev;
}
