import { TableData } from '../utils/configUtils';
import { createRequiredContext, RequiredContext } from '../utils/contextUtils';
import State from '../models/state';
import { ElementRef } from '../utils/refUtils';

export interface TableRefs {
    head: ElementRef;
    headColGroup: ElementRef<HTMLTableColElement>;
    bodyColGroup: ElementRef<HTMLTableColElement>;
}

interface TableContextValue<TData extends TableData> {
    state: State<TData>;
    refs: TableRefs;
}

export const TableContext = createRequiredContext<TableContextValue<TableData>>();
TableContext.displayName = 'TableContext';

const getTableContext = <TData extends TableData>() => TableContext as RequiredContext<TableContextValue<TData>>;

export default getTableContext;