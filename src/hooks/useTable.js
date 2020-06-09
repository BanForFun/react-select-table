import { initTable, disposeTable } from "../utils/tableUtils";
import useEffectInit from "./useEffectInit";

/**
 * Creates and injects a table reducer, removing it when umnounting
 *
 * @deprecated since 2.4.0; use withTable HOC instead
 */
export default function useTable(namespace, options = undefined) {
    useEffectInit(() => {
        initTable(namespace, options);
        return () => disposeTable(namespace);
    }, [namespace, options]);
}