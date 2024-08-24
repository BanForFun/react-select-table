import React, { useEffect, useLayoutEffect } from 'react';
import { ReadonlyHeader } from '../models/state/HeaderSlice';
import getTableContext from '../context/controllerContext';
import { TableData } from '../utils/configUtils';
import { TreePath } from '../utils/unrootedTreeUtils';
import useRequiredContext from '../hooks/useRequiredContext';
import { isSortableColumn, SortColumn } from '../models/state/SortOrderSlice';
import useUpdate from '../hooks/useUpdate';
import AngleIcon, { Rotation } from './AngleIcon';

interface SortHeader {
    path: TreePath;
    column: SortColumn | null;
}

interface VisibleHeader {
    key: string;
    span: number;
    content: React.ReactNode;
    sort?: SortHeader;
}

interface AddedVisibleHeader extends VisibleHeader {
    height: number;
}

export default function TableHead<TData extends TableData>() {
    const { state, callbacks } = useRequiredContext(getTableContext<TData>());

    const [updateHeaders, headersUpdated] = useUpdate();
    const [updateSortOrder] = useUpdate();

    useEffect(() => {
        return state.headers.changed.addObserver(updateHeaders);
    }, [state, updateHeaders]);

    useEffect(() => {
        return state.sortOrder.changed.addObserver(updateSortOrder);
    }, [state, updateSortOrder]);

    useLayoutEffect(() => {
        callbacks.updateColumns!();
    }, [headersUpdated, callbacks]);

    const headerRows: VisibleHeader[][] = [[]];
    const heightOfRowLevel = (level: number) => headerRows.length - 1 - level;

    function addHeader(header: ReadonlyHeader<TData>, path: TreePath, tallestSibling: number): AddedVisibleHeader {
        const visibleHeader: AddedVisibleHeader = {
            key: `header_${header.id}`,
            span: 1,
            height: 0,
            content: header.column.header
        };

        if (isSortableColumn(header.column))
            visibleHeader.sort = {
                path: state.columns.getPath(header.column),
                column: state.sortOrder.get(header.column)
            };

        let childCount = 0;
        if (header.children) {
            let tallestChild = 0;
            let totalSpan = 0;

            for (const child of header.children) {
                const header = addHeader(child, [...path, childCount++], tallestChild);
                tallestChild = Math.max(tallestChild, header.height);
                totalSpan += header.span;
            }

            visibleHeader.height = tallestChild + 1;
            visibleHeader.span = totalSpan;
        }

        const addSpacers = (siblingsOnly: boolean = false) => {
            const bottomRow = headerRows[visibleHeader.height - 1];

            const endIndex = bottomRow.length - childCount;
            const startIndex = siblingsOnly ? endIndex - path.at(-1)! : 0;

            for (let i = startIndex; i < endIndex; i++) {
                const column = bottomRow[i];
                headerRows[visibleHeader.height].push({
                    key: `spacer_${column.key}`,
                    span: column.span,
                    content: null
                });
            }
        };

        if (visibleHeader.height >= headerRows.length) {
            headerRows.push([]);
            addSpacers();
        } else if (visibleHeader.height > tallestSibling) {
            addSpacers(true);
        }

        headerRows[visibleHeader.height].push(visibleHeader);

        for (let height = visibleHeader.height + 1; height <= tallestSibling; height++)
            headerRows[height].push({
                key: `spacer_${visibleHeader.key}`,
                span: visibleHeader.span,
                content: null
            });

        return visibleHeader;
    }

    for (const column of state.headers.iterator())
        addHeader(column, [headerRows.at(-1)!.length], headerRows.length - 1);

    function renderHeader(header: VisibleHeader) {
        return <th
            key={header.key}
            colSpan={header.span}
            onClick={e => {
                if (!header.sort) return;

                const { path } = header.sort;
                state.history.group(() => {
                    state.visibleRows.setPageIndex(0, false);
                    state.sortOrder.sortBy(path, e.shiftKey ? 'cycle' : 'toggle', e.ctrlKey);
                });
            }}
        >
            <span className="rst-content">
                <span className="rst-inner">{header.content}</span>
                {header.sort?.column && <HeaderStatus>
                    <AngleIcon rotation={header.sort.column.order === 'ascending' ? Rotation.Up : Rotation.Down} />
                    <span className="rst-sortIndex">
                        {/* Narrow non-breaking space */}
                        &#8239;<small>{header.sort.column.index + 1}</small>
                    </span>
                </HeaderStatus>}
            </span>
        </th>;
    }

    return <table className="rst-table rst-head" aria-hidden={true}>
        <thead>
        {headerRows.map((_, level) => {
            const height = heightOfRowLevel(level);
            const headers = headerRows[height];
            return <tr className="rst-row" key={height}>
                {headers.map(renderHeader)}
                <th className="rst-spacer" />
            </tr>;
        })}
        </thead>
    </table>;
}


function HeaderStatus({ children }: { children: React.ReactNode }) {
    return <>
        <span className="rst-spacer">{' '}</span>
        <span className="rst-inlineIcons rst-status">{children}</span>
    </>;
}