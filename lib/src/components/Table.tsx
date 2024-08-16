import TableHead from './TableHead';
import TableBody from './TableBody';
import getTableContext, { TableCallbacks } from '../context/controllerContext';
import { useMemo, useState } from 'react';
import { TableData } from '../utils/configUtils';
import State from '../models/state';

interface Props<TData extends TableData> {
    state: State<TData>;
}

export default function Table<TData extends TableData>({ state }: Props<TData>) {
    const [callbacks] = useState<TableCallbacks>({});
    const contextValue = useMemo(() => ({ state, callbacks }), [state, callbacks]);

    const TableContext = getTableContext<TData>();
    return <div className="rst-container">
        <TableContext.Provider value={contextValue}>
            <TableHead />
            <TableBody />
        </TableContext.Provider>
    </div>;
}