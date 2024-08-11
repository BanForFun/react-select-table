import { TableData } from '../utils/configUtils';
import { ColumnUpdate } from '../models/state/ColumnState';
import Controller from '../models/Controller';
import { createRequiredContext, RequiredContext } from '../utils/contextUtils';

export interface TableCallbacks<TData extends TableData> {
    updateColumns?: (updates: ColumnUpdate<TData>[]) => void;
}

interface TableContextValue<TData extends TableData> {
    controller: Controller<TData>;
    callbacks: TableCallbacks<TData>;
}

const TableContext = createRequiredContext<TableContextValue<TableData>>();
TableContext.displayName = 'TableContext';

const getTableContext = <TData extends TableData>() => TableContext as RequiredContext<TableContextValue<TData>>;

export default getTableContext;