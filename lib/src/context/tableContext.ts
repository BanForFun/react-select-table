import { TableData } from '../utils/configUtils';
import { createRequiredContext, RequiredContext } from '../utils/contextUtils';
import State from '../models/state';
import { ElementRef } from '../utils/refUtils';
import ColumnMap from '../models/ColumnMap';

export interface TableRefs<TData extends TableData> {
    head: ElementRef;
    resizingContainer: ElementRef;
    headColumns: ColumnMap<TData>;
    bodyColumns: ColumnMap<TData>;
}

interface TableContextValue<TData extends TableData> {
    state: State<TData>;
    refs: TableRefs<TData>;
}

export const TableContext = createRequiredContext<TableContextValue<TableData>>();
TableContext.displayName = 'TableContext';

const getTableContext = <TData extends TableData>() => TableContext as RequiredContext<TableContextValue<TData>>;

export default getTableContext;