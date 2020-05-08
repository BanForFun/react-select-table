import { useEffect } from "react";
import { initTable, disposeTable } from "../utils/tableUtils";

export default function useTable(tableName, options = undefined) {
    useEffect(() => {
        initTable(tableName, options);
        return () => disposeTable(tableName);
    }, []);
}