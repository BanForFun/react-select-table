import { useRef, useEffect } from "react";

export default function useEvent(target, event, listener, options) {
    const optionsRef = useRef(options);

    useEffect(() => {
        const options = optionsRef.current;
        target.addEventListener(event, listener, options);

        return () => removeEventListener(event, listener, options);
    }, [target, event, listener, options])
}