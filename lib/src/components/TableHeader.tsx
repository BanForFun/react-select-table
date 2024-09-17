import React from 'react';
import { isSortableColumn } from '../models/state/SortOrderSlice';
import ColumnResizer, { ResizerType } from './ColumnResizer';
import AngleIcon, { Rotation } from './AngleIcon';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import useUpdateWhen from '../hooks/useUpdateWhen';
import { Column } from '../utils/columnUtils';

interface TableHeaderProps<TData extends TableData> {
    span: number;
    column: Column<TData['row']> | null;
    addResizer: boolean;
}

function Status({ children }: { children: React.ReactNode }) {
    return <>
        <span className="rst-spacer">{' '}</span>
        <span className="rst-status">{children}</span>
    </>;
}

function TableHeader<TData extends TableData>({ span, column, addResizer }: TableHeaderProps<TData>) {
    const { state } = useRequiredContext(getTableContext<TData>());

    useUpdateWhen(state.sortOrder.changed);

    const sortable = column != null && isSortableColumn(column) ? {
        path: state.columns.getPath(column),
        sorted: state.sortOrder.get(column)
    } : null;

    const handleClick: React.MouseEventHandler = e => {
        if (!sortable) return;
        const { path } = sortable;

        state.history.group(() => {
            state.visibleRows.setPageIndex(0, false);
            state.sortOrder.sortBy(path, e.shiftKey ? 'cycle' : 'toggle', e.ctrlKey);
        });
    };

    return <th
        className="rst-header"
        colSpan={span}
        data-is-sortable={!!sortable}
        onClick={handleClick}
    >
        {addResizer && <ColumnResizer type={ResizerType.Normal} />}
        <div className="rst-content">
            <span className="rst-inner rst-ellipsis">{column?.header}</span>
            {sortable?.sorted && <Status>
                <AngleIcon rotation={sortable.sorted.order === 'ascending' ? Rotation.Up : Rotation.Down} />
                <div className="rst-ellipsis">
                    {/* Narrow non-breaking space */}
                    &#8239;
                    <small>{sortable.sorted.index + 1}</small>
                </div>
            </Status>}
        </div>
    </th>;
}

export default TableHeader;

