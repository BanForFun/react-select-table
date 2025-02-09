import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import useRequiredContext from '../hooks/useRequiredContext';
import TableRow from './TableRow';
import { map } from '../utils/iterableUtils';
import ColumnGroup from './ColumnGroup';
import useUpdateWhen from '../hooks/useUpdateWhen';


export default function TableBody<TData extends TableData>() {
    const { state, refs } = useRequiredContext(getTableContext<TData>());

    useUpdateWhen(state.visibleRows.changed);

    return <table className="rst-table rst-body">
        <ColumnGroup refMap={refs.bodyColumns} />
        {/* TODO: Add hidden thead for screen readers */}
        <tbody>
        {Array.from(map(state.visibleRows.iterator(), row =>
            <TableRow
                key={state.rows.getRowKey(row)}
                data={row}
            />
        ))}
        </tbody>
    </table>;
}