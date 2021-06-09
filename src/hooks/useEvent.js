import _ from "lodash";
import { useEffect } from "react";

export default function useEvent(target, event, listener, passive = true, throttle = 0) {
    useEffect(() => {
        if (!target) return;
        const options = { passive };
        const callback = throttle > 0 ? _.throttle(listener, throttle) : listener;

        target.addEventListener(event, callback, options);
        return () => target.removeEventListener(event, callback, options);
    }, [
        target, event, listener,
        passive, throttle
    ]);
}
