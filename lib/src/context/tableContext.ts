import { TableData } from '../utils/configUtils';
import { createRequiredContext, RequiredContext } from '../utils/contextUtils';
import State from '../models/state';

export interface TableCallbacks {
    updateColumns?: () => void;
}

interface TableContextValue<TData extends TableData> {
    state: State<TData>;
    callbacks: TableCallbacks;
}

export const TableContext = createRequiredContext<TableContextValue<TableData>>();
TableContext.displayName = 'TableContext';

const getTableContext = <TData extends TableData>() => TableContext as RequiredContext<TableContextValue<TData>>;

export default getTableContext;