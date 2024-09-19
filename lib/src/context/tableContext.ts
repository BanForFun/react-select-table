import { TableData } from '../utils/configUtils';
import { createRequiredContext, RequiredContext } from '../utils/contextUtils';
import State from '../models/state';
import { ElementRef } from '../utils/refUtils';
import { ReadonlyLeafHeader } from '../models/state/HeaderSlice';

export interface TableRefs<TData extends TableData> {
    head: ElementRef;
    headColumns: WeakMap<ReadonlyLeafHeader<TData>, HTMLTableColElement>;
    bodyColumns: WeakMap<ReadonlyLeafHeader<TData>, HTMLTableColElement>;
}

interface TableContextValue<TData extends TableData> {
    state: State<TData>;
    refs: TableRefs<TData>;
}

export const TableContext = createRequiredContext<TableContextValue<TableData>>();
TableContext.displayName = 'TableContext';

const getTableContext = <TData extends TableData>() => TableContext as RequiredContext<TableContextValue<TData>>;

export default getTableContext;