import { TableData } from '../utils/configUtils';
import { map } from '../utils/iterableUtils';
import { ColumnOptions } from '../utils/columnUtils';
import State from '../models/state';
import React from 'react';
import { buildClass } from '../utils/classNameUtils';

interface Props<TData extends TableData> {
    state: State<TData>;
    data: TData['row'];
}

export default function TableRow<TData extends TableData>(props: Props<TData>) {
    return <>
        {Array.from(map(props.state.headers.leafIterator(), header => {
            const options: ColumnOptions = {};
            const content = header.column.render(props.data, options);
            if (!header.column.isHeader)
                return <td key={header.id} className={options.className}>{content}</td>;

            return <th key={header.id}
                       className={buildClass('rst-header', options.className)}
                       scope="row"
            >{content}</th>;
        }))}
        <td className="rst-spacer" />
    </>;
}