import React, {useMemo} from 'react';
import {makeGetPageCount} from "../selectors/paginationSelectors";
import {useSelector} from "react-redux";

export default function useTable(name) {
    //Properties
    const props = {
        tableProps: { name }
    };

    const state = useSelector(s => s[name]);

    const getPageCount = useMemo(makeGetPageCount, []);

    props.pageCount = useSelector(() => getPageCount(state));
    props.tableItems = useSelector(() => state.tableItems);
    props.keyedItems = useSelector(() => state.items);
    props.selection = useSelector(() => [...state.selection]);

    return props;
}
