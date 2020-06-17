import { useRef } from "react";

export default function useConstructor(callback) {
    const hasRun = useRef(false);
    if (hasRun.current) return;

    callback();
    hasRun.current = true;
}
