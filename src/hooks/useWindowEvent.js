import { useEffect } from "react";


export default function useWindowEvent(event, listener) {
    useEffect(() => {
        window.addEventListener(event, listener, {passive: false});
        return () => window.removeEventListener(event, listener);
    }, [event, listener]);
}
