import React, { useCallback } from 'react';
import { isSortableColumn } from '../models/state/SortOrderSlice';
import ColumnResizer, { ResizerType } from './ColumnResizer';
import AngleIcon, { Rotation } from './AngleIcon';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import useUpdateWhen from '../hooks/useUpdateWhen';
import { Column } from '../utils/columnUtils';
import useElementRef from '../hooks/useElementRef';
import { enableGestures, gestureEventManager } from '../utils/gestureUtils';
import { NewSortOrder } from '../models/state/ColumnSlice';
import { ReadonlyHeader } from '../models/state/HeaderSlice';

interface TableHeaderProps<TData extends TableData> {
    span: number;
    header: ReadonlyHeader<TData>;
    column?: Column<TData['row']>;
}

function Status({ children }: { children: React.ReactNode }) {
    return <>
        <span className="rst-spacer">{' '}</span>
        <span className="rst-status">{children}</span>
    </>;
}

function TableHeader<TData extends TableData>(props: TableHeaderProps<TData>) {
    const { span, column, header } = props;

    const { state } = useRequiredContext(getTableContext<TData>());
    useUpdateWhen(state.sortOrder.changed);

    const elementRef = useElementRef<HTMLTableCellElement>();

    elementRef.useEffect(useCallback(element => {
        enableGestures({ element });
    }, []));

    gestureEventManager.useListener(elementRef, 'leftMouseClick', e => {
        sortBy(e.detail.shiftKey ? 'toggle' : 'cycle', e.detail.ctrlKey);
    });

    gestureEventManager.useListener(elementRef, 'shortTap', () => {
        sortBy('toggle', false);
    });

    gestureEventManager.useListener(elementRef, 'dualTap', () => {
        sortBy('toggle', true);
    });

    gestureEventManager.useListener(elementRef, 'longTap', () => {
        sortBy('cycle', true);
    });

    gestureEventManager.useListener(elementRef, 'dragStart', () => {

    });

    const sortable = column != null && isSortableColumn(column) ? {
        path: state.columns.getPath(column),
        sorted: state.sortOrder.get(column)
    } : null;

    const sortBy = (order: NewSortOrder, append: boolean) => {
        if (!sortable) return;
        const { path } = sortable;

        state.history.group(() => {
            state.visibleRows.setPageIndex(0, false);
            state.sortOrder.sortBy(path, order, append);
        });
    };

    return <th
        ref={elementRef.set}
        className="rst-header"
        colSpan={span}
        data-is-sortable={!!sortable}
    >
        <ColumnResizer header={header} type={ResizerType.Normal} />
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

