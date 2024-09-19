import React, { useCallback } from 'react';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import useRequiredContext from '../hooks/useRequiredContext';
import useUpdateWhen from '../hooks/useUpdateWhen';
import { enableGestures } from '../utils/gestureUtils';
import ColumnResizer, { ResizerType } from './ColumnResizer';
import ColGroup from './ColumnGroup';
import TableHeader from './TableHeader';
import { mapReverse } from '../utils/arrayUtils';

function TableHead<TData extends TableData>() {
    const { state, refs } = useRequiredContext(getTableContext<TData>());

    useUpdateWhen(state.headers.rowsChanged);

    refs.head.useEffect(useCallback(element => {
        enableGestures({ element });
    }, []));

    return <table
        className="rst-table rst-head"
        aria-hidden={true}
        ref={refs.head.set}
    >
        <ColGroup columnRefMap={refs.headColumns} />
        <thead>
        {mapReverse(state.headers.rows, (cells, height) => {
            const spacerResizerProps = { height, index: cells.length - 1 };
            return <tr className="rst-row" key={height}>
                {cells.map((cell, index) =>
                    <TableHeader
                        key={cell.id}
                        span={cell.span}
                        column={cell.column}
                        height={height}
                        index={index}
                    />
                )}
                <th className="rst-spacer">
                    <ColumnResizer {...spacerResizerProps} type={ResizerType.Normal} />
                    <ColumnResizer {...spacerResizerProps} type={ResizerType.Edge} />
                </th>
            </tr>;
        })}
        </thead>
    </table>;
}


export default TableHead;