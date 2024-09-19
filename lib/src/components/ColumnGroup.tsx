import useUpdateWhen from '../hooks/useUpdateWhen';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import { map } from '../utils/iterableUtils';
import React from 'react';
import Column from './Column';
import { ReadonlyLeafHeader } from '../models/state/HeaderSlice';

interface Props<TData extends TableData> {
    columnRefMap: WeakMap<ReadonlyLeafHeader<TData>, HTMLTableColElement>;
}

function ColGroup<TData extends TableData>(props: Props<TData>) {
    const { columnRefMap } = props;

    const { state } = useRequiredContext(getTableContext<TData>());
    useUpdateWhen(state.headers.rowsChanged);

    return <colgroup>
        {Array.from(map(state.headers.leafIterator(), header =>
            <Column
                key={header.id}
                header={header}
                refMap={columnRefMap}
            />))}
        <col />
    </colgroup>;
}

export default ColGroup;