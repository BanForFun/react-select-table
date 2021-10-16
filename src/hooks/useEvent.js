import { useEffect } from "react";
import useDecoupledCallback from "./useDecoupledCallback";

export default function useEvent(target, event, listener, passive = true) {
    const decoupledListener = useDecoupledCallback(listener);

    useEffect(() => {
        if (!target) return;
        const options = { passive };

        target.addEventListener(event, decoupledListener, options);
        return () =>
            target.removeEventListener(event, decoupledListener, options);
    }, [target, event, decoupledListener, passive]);
}
