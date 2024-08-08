import TableHead from './TableHead';
import TableBody from './TableBody';
import getTableContext, { TableCallbacks } from '../context/controllerContext';
import { useMemo, useState } from 'react';
import { TableData } from '../utils/configUtils';
import Controller from '../models/Controller';

interface Props<TData extends TableData> {
    controller: Controller<TData>;
}

export default function Table<TData extends TableData>({ controller }: Props<TData>) {
    const [callbacks] = useState<TableCallbacks<TData>>({});
    const contextValue = useMemo(() => ({ controller, callbacks }), [controller, callbacks]);

    const TableContext = getTableContext<TData>();
    return <div className="rst-container">
        <TableContext.Provider value={contextValue}>
            <TableHead />
            <TableBody />
        </TableContext.Provider>
    </div>;
}