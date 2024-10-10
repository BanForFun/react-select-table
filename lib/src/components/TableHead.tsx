import React, { useCallback } from 'react';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import useRequiredContext from '../hooks/useRequiredContext';
import useUpdateWhen from '../hooks/useUpdateWhen';
import { enableGestures } from '../utils/gestureUtils';
import ColumnResizer, { ResizerType } from './ColumnResizer';
import ColumnGroup from './ColumnGroup';
import TableHeader from './TableHeader';
import { mapReverse } from '../utils/arrayUtils';
import useElementRef from '../hooks/useElementRef';

export interface TableHeadProps {
    minColumnWidthPx: number;
}

function TableHead<TData extends TableData>(props: TableHeadProps) {
    const { minColumnWidthPx } = props;

    const { state, refs } = useRequiredContext(getTableContext<TData>());

    useUpdateWhen(state.headers.rowsChanged);

    const spacerRef = useElementRef<HTMLTableCellElement>();

    refs.head.useEffect(useCallback(element => {
        enableGestures({ element });
    }, []));

    return <table
        className="rst-table rst-head"
        aria-hidden={true}
        ref={refs.head.set}
    >
        <ColumnGroup refMap={refs.headColumns} />
        <thead>
        {mapReverse(state.headers.rows, (cells, height) => <tr className="rst-row" key={height}>
            {cells.map(cell =>
                <TableHeader
                    key={cell.id}
                    span={cell.span}
                    column={cell.column}
                    header={cell.header}
                    minColumnWidthPx={minColumnWidthPx}
                />
            )}
            <th className="rst-spacer" ref={spacerRef.set}>
                <ColumnResizer type={ResizerType.Normal}
                               minColumnWidthPx={minColumnWidthPx}
                               headerRef={spacerRef}
                />
                <ColumnResizer type={ResizerType.Edge}
                               minColumnWidthPx={minColumnWidthPx}
                               headerRef={spacerRef}
                />
            </th>
        </tr>)}
        </thead>
    </table>;
}


export default TableHead;