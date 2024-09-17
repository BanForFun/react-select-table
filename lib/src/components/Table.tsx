import getTableContext, { TableRefs } from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import State from '../models/state';
import Pagination from './Pagination';
import ScrollingContainer from './ScrollingContainer';
import useConstant from '../hooks/useConstant';
import { createElementRef } from '../utils/refUtils';
import useComparatorMemo from '../hooks/useComparatorMemo';
import { isShallowEqual } from '../utils/objectUtils';

interface Props<TData extends TableData> {
    state: State<TData>;
    headerNoWrap?: boolean;
}

export default function Table<TData extends TableData>({ state, headerNoWrap = false }: Props<TData>) {
    const refs = useConstant<TableRefs>(() => ({
        head: createElementRef()
    }));

    const contextValue = useComparatorMemo({ state, refs }, isShallowEqual);

    const TableContext = getTableContext<TData>();
    return <div className="rst-container" data-header-nowrap={headerNoWrap}>
        <TableContext.Provider value={contextValue}>
            <ScrollingContainer />
            <Pagination />
        </TableContext.Provider>
    </div>;
}