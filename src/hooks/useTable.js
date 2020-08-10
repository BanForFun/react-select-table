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

    return props;
}
