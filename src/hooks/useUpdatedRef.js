import {useEffect} from "react";

export default function useUpdatedRef(value) {
    const valueRef = useRef();

    useEffect(() => {
        valueRef.current = value;
    }, [valueRef, value]);

    return valueRef;
}
