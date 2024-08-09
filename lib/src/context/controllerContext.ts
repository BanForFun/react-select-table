import { createContext, Context } from 'react';
import { TableData } from '../utils/configUtils';
import { UpdateColumnsEventArgs } from '../models/ColumnState';
import Controller from '../models/Controller';

export interface TableCallbacks<TData extends TableData> {
    updateBody?: (updates: UpdateColumnsEventArgs<TData>[]) => void;
}

interface TableContextValue<TData extends TableData> {
    controller?: Controller<TData>;
    callbacks: TableCallbacks<TData>;
}

const TableContext = createContext<TableContextValue<TableData>>({ callbacks: {} });
const getTableContext = <TData extends TableData>() => TableContext as unknown as Context<TableContextValue<TData>>;

export default getTableContext;