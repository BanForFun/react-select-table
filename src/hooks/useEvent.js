import { useEffect } from "react";

export default function useEvent(target, event, listener, passive = true) {
    useEffect(() => {
        const options = { passive };

        target.addEventListener(event, listener, options);
        return () => target.removeEventListener(event, listener, options);
    }, [target, event, listener, passive]);
}