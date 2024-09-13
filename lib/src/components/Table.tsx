import getTableContext, { TableCallbacks } from '../context/tableContext';
import { useMemo, useState } from 'react';
import { TableData } from '../utils/configUtils';
import State from '../models/state';
import Pagination from './Pagination';
import ScrollingContainer from './ScrollingContainer';

interface Props<TData extends TableData> {
    state: State<TData>;
    headerNoWrap?: boolean;
}

export default function Table<TData extends TableData>({ state, headerNoWrap = false }: Props<TData>) {
    const [callbacks] = useState<TableCallbacks>({});
    const contextValue = useMemo(() => ({ state, callbacks }), [state, callbacks]);

    const TableContext = getTableContext<TData>();
    return <div className="rst-container" data-header-nowrap={headerNoWrap}>
        <TableContext.Provider value={contextValue}>
            <ScrollingContainer />
            <Pagination />
        </TableContext.Provider>
    </div>;
}