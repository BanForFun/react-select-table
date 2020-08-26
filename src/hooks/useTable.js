import React, {useMemo} from 'react';
import {makeGetPageCount} from "../selectors/paginationSelectors";
import {useSelector} from "react-redux";

export default function useTable(name) {
    const props = {
        tableProps: { name }
    };

    const table = useSelector(s => s[name]);

    //Pagination
    const getPageCount = useMemo(makeGetPageCount, []);
    props.pageCount = useSelector(() => getPageCount(table));
    props.tableItems = useSelector(() => table.tableItems);
    props.selectedValues = useSelector(() => table.selectedValues);

    return props;
}
