import getTableContext, { TableRefs } from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import State from '../models/state';
import Pagination from './Pagination';
import ScrollingContainer from './ScrollingContainer';
import useConstant from '../hooks/useConstant';
import { createElementRef } from '../utils/refUtils';
import useComparatorMemo from '../hooks/useComparatorMemo';
import { isShallowEqual } from '../utils/objectUtils';
import ColumnMap from '../models/ColumnMap';

interface TableProps<TData extends TableData> {
    state: State<TData>;
    headerNoWrap?: boolean;
    minColumnWidthPx?: number;
}

export default function Table<TData extends TableData>(props: TableProps<TData>) {
    const {
        state,
        headerNoWrap = false,
        minColumnWidthPx = 25
    } = props;

    const refs = useConstant<TableRefs<TData>>(() => ({
        head: createElementRef(),
        resizingContainer: createElementRef(),
        headColumns: new ColumnMap(),
        bodyColumns: new ColumnMap()
    }));

    const contextValue = useComparatorMemo({ state, refs }, isShallowEqual);

    const TableContext = getTableContext<TData>();
    return <div className="rst-container" data-header-nowrap={headerNoWrap}>
        <TableContext.Provider value={contextValue}>
            <ScrollingContainer minColumnWidthPx={minColumnWidthPx} />
            <Pagination />
        </TableContext.Provider>
    </div>;
}