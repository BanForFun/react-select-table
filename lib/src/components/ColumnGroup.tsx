import useUpdateWhen from '../hooks/useUpdateWhen';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import { map } from '../utils/iterableUtils';
import React, { useCallback } from 'react';
import Column from './Column';
import ColumnMap from '../models/ColumnMap';
import useElementRef from '../hooks/useElementRef';

export interface ColumnGroupProps<TData extends TableData> {
    refMap: ColumnMap<TData>;
}

function ColumnGroup<TData extends TableData>(props: ColumnGroupProps<TData>) {
    const { refMap } = props;

    const { state } = useRequiredContext(getTableContext<TData>());
    useUpdateWhen(state.headers.rowsChanged);

    const spacerRef = useElementRef<HTMLTableColElement>();

    spacerRef.useEffect(useCallback(el => {
        refMap.spacer = el;
        return () => refMap.spacer = null;
    }, [refMap]));

    spacerRef.useEffect(useCallback(el => state.headerSizes.changed.addObserver(() => {
        el.style.width = '';
    }), [state]));

    return <colgroup>
        {Array.from(map(state.headers.leafIterator(), header =>
            <Column
                key={header.id}
                header={header}
                refMap={refMap}
            />))}
        <col ref={spacerRef.set} />
    </colgroup>;
}

export default ColumnGroup;