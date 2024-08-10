import { TableData } from '../utils/configUtils';
import Controller from '../models/Controller';
import { map } from '../utils/iterableUtils';
import { ColumnOptions } from '../utils/columnUtils';

interface Props<TData extends TableData> {
    controller: Controller<TData>;
    data: TData['row'];
}

export default function TableRow<TData extends TableData>(props: Props<TData>) {
    return Array.from(map(props.controller.state.columns.leafHeaderIterator(), header => {
        const options: ColumnOptions = {};
        const content = header.column.render(props.data, options);
        return <td key={header.id} className={options.className}>{content}</td>;
    }));
}