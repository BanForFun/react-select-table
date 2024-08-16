import { TableData } from '../utils/configUtils';
import { map } from '../utils/iterableUtils';
import { ColumnOptions } from '../utils/columnUtils';
import State from '../models/state';

interface Props<TData extends TableData> {
    state: State<TData>;
    data: TData['row'];
}

export default function TableRow<TData extends TableData>(props: Props<TData>) {
    return Array.from(map(props.state.headers.leafIterator(), header => {
        const options: ColumnOptions = {};
        const content = header.column.render(props.data, options);
        return <td key={header.id} className={options.className}>{content}</td>;
    }));
}