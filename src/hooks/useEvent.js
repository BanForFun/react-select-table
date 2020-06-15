import { useEffect } from "react";
import useConst from "./useConst";

export default function useEvent(target, event, listener, options) {
    const _options = useConst(options);

    useEffect(() => {
        target.addEventListener(event, listener, _options);
        return () => removeEventListener(event, listener, _options);
    }, [target, event, listener, _options])
}
