import { useEffect } from "react";

const options = { passive: false };

export default function useWindowEvent(event, listener) {
    useEffect(() => {
        window.addEventListener(event, listener, options);
        return () => window.removeEventListener(event, listener, options);
    }, [event, listener]);
}
