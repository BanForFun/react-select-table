import { initTable, disposeTable } from "../utils/tableUtils";
import useEffectInit from "./useEffectInit";

export default function useTable(tableName, options = undefined) {
    useEffectInit(() => {
        initTable(tableName, options);
        return () => disposeTable(tableName);
    }, [tableName, options]);
}