import React, { useEffect, useLayoutEffect, useState, useRef, useContext } from 'react';
import { Header, isSortableHeader, SortColumn, UpdateColumnsEventArgs } from '../models/ColumnState';
import getTableContext from '../context/controllerContext';
import { TableData } from '../utils/configUtils';
import { TreePath } from '../utils/unrootedTreeUtils';

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
    const { controller, callbacks } = useContext(getTableContext<TData>());

    const queuedUpdatesRef = useRef<UpdateColumnsEventArgs<TData>[]>([]);
    const [updates, setUpdates] = useState<UpdateColumnsEventArgs<TData>[]>([]);

    useEffect(() => {
        return controller!.state.columns.updateColumns.addObserver(args => {
            queuedUpdatesRef.current.push(args);
        });
    }, [controller]);

    useEffect(() => {
        return controller!.state.columns.refreshHeaders.addObserver(() => {
            setUpdates(queuedUpdatesRef.current);
        });
    }, [controller]);

    useLayoutEffect(() => {
        queuedUpdatesRef.current = [];
        callbacks.updateBody!(updates);
    }, [updates, callbacks]);

    const headerRows: VisibleHeader[][] = [[]];
    const heightOfRowLevel = (level: number) => headerRows.length - 1 - level;

    function addHeader(header: Header, path: TreePath, tallestSibling: number): AddedVisibleHeader {
        const visibleHeader: AddedVisibleHeader = {
            key: `header_${header.id}`,
            span: 1,
            height: 0,
            content: header.content
        };

        if (isSortableHeader(header))
            visibleHeader.sort = { path, column: header.sortColumn };

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

    for (const column of controller!.state.columns.headerIterator())
        addHeader(column, [headerRows.at(-1)!.length], headerRows.length - 1);

    return <div className="rst-head">
        <table>
            <thead>
            {headerRows.map((_, level) => {
                const height = heightOfRowLevel(level);
                const headers = headerRows[height];
                return <tr key={height}>
                    {headers.map(header => <th key={header.key} colSpan={header.span} onClick={e => {
                        if (!header.sort) return;
                        controller!.actions.sortByHeader(header.sort.path, e.shiftKey ? 'cycle' : 'toggle', e.ctrlKey);
                    }}>
                        {header.content}<br />
                        {header.sort?.column && `${header.sort.column.order} (${header.sort.column.index})`}
                    </th>)}
                </tr>;
            })}
            </thead>
        </table>
    </div>;
}