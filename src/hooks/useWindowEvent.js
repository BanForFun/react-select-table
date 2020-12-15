import { useEffect } from "react";

export default function useWindowEvent(event, listener, passive = true) {
    useEffect(() => {
        const options = {
            passive
        };

        window.addEventListener(event, listener, options);
        return () => window.removeEventListener(event, listener, options);
    }, [event, listener, passive]);
}
