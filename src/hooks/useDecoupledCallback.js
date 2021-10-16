import useUpdatedRef from "./useUpdatedRef";
import { useCallback } from "react";

export default function useDecoupledCallback(callback) {
    const callbackRef = useUpdatedRef(callback);

    return useCallback(
        (...args) => callbackRef.current(...args),
        [callbackRef]
    );
}
