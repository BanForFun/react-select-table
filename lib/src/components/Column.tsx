import { TableData } from '../utils/configUtils';
import { ReadonlyLeafHeader } from '../models/state/HeaderSlice';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import useUpdateWhen from '../hooks/useUpdateWhen';
import { unit } from '../utils/unitUtils';
import React, { useCallback } from 'react';
import useElementRef from '../hooks/useElementRef';
import ColumnMap from '../models/ColumnMap';

export interface ColumnProps<TData extends TableData> {
    header: ReadonlyLeafHeader<TData>;
    refMap: ColumnMap<TData>;
}

function Column<TData extends TableData>(props: ColumnProps<TData>) {
    const { refMap, header } = props;

    const { state } = useRequiredContext(getTableContext<TData>());
    useUpdateWhen(state.headerSizes.changed);

    const elementRef = useElementRef<HTMLTableColElement>();
    elementRef.useEffect(useCallback(element => {
        const updateWidth = () => {
            element.style.width = unit(state.headerSizes.get(header), '%');
        };

        updateWidth();
        return state.headerSizes.changed.addObserver(updateWidth);
    }, [state, header]));

    elementRef.useEffect(useCallback(element => {
        refMap.set(header, element);
        return () => refMap.set(header, null);
    }, [refMap, header]));

    return <col ref={elementRef.set} />;
}

export default Column;