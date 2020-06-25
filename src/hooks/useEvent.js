import { useEffect } from "react";

export default function useEvent(target, event, listener, options) {
    useEffect(() => {
        target.addEventListener(event, listener, options);
        return () => target.removeEventListener(event, listener, options);
    }, [target, event, listener, options])
}
