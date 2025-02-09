import { TableData } from '../utils/configUtils';
import { map } from '../utils/iterableUtils';
import { ColumnOptions } from '../utils/columnUtils';
import React, { useCallback } from 'react';
import { buildClass } from '../utils/classNameUtils';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import useElementRef from '../hooks/useElementRef';
import { enableGestures } from '../utils/gestureUtils';

export interface TableRowProps<TData extends TableData> {
    data: TData['row'];
}

export default function TableRow<TData extends TableData>(props: TableRowProps<TData>) {
    const { data } = props;

    const { state } = useRequiredContext(getTableContext<TData>());

    const elementRef = useElementRef();

    elementRef.useEffect(useCallback(element => {
        enableGestures({ element });
    }, []));

    return <tr ref={elementRef.set} className="rst-row">
        {Array.from(map(state.headers.leafIterator(), header => {
            const options: ColumnOptions = {};
            const content = header.column.render(data, options);
            if (!header.column.isHeader)
                return <td key={header.id} className={options.className}>{content}</td>;

            return <th key={header.id}
                       className={buildClass('rst-header', options.className)}
                       scope="row"
            >{content}</th>;
        }))}
        <td className="rst-spacer" />
    </tr>;
}