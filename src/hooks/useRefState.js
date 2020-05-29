import { useEffect, useRef, useState } from "react";

export default function useRefState(initialValue) {
    const [state, setState] = useState(initialValue)
    const stateRef = useRef(state)
    useEffect(() => {
        stateRef.current = state
    }, [state]);

    return [state, stateRef, setState]
}