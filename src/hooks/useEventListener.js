import { useEffect } from "react";

const options = {
    passive: false
};

export default function useEventListener(target, event, listener) {
    useEffect(() => {
        target.addEventListener(event, listener, options);
        return () => target.removeEventListener(event, listener, options);
    }, [target, event, listener])
}
