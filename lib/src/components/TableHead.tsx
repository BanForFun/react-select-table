import React, { useCallback } from 'react';
import { ReadonlyHeader } from '../models/state/HeaderSlice';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import { TreePath } from '../utils/unrootedTreeUtils';
import useRequiredContext from '../hooks/useRequiredContext';
import useUpdateWhen from '../hooks/useUpdateWhen';
import { enableGestures, gestureEventManager } from '../utils/gestureUtils';
import ColumnResizer, { ResizerType } from './ColumnResizer';
import ColGroup from './ColumnGroup';
import TableHeader from './TableHeader';
import { Column } from '../utils/columnUtils';

interface VisibleHeader<TData extends TableData> {
    key: string;
    span: number;
    column: Column<TData['row']> | null;
}

interface AddedVisibleHeader<TData extends TableData> extends VisibleHeader<TData> {
    height: number;
}

function TableHead<TData extends TableData>() {
    const { state, refs } = useRequiredContext(getTableContext<TData>());

    useUpdateWhen(state.headers.changed);

    refs.head.useEffect(useCallback(element => {
        enableGestures({ element });
    }, []));

    gestureEventManager.useListener(refs.head, 'leftMouseDown', e => {
        if (e.target === e.currentTarget)
            e.preventDefault();
    });

    const headerRows: VisibleHeader<TData>[][] = [[]];
    const heightOfRowLevel = (level: number) => headerRows.length - 1 - level;

    function addHeader(header: ReadonlyHeader<TData>, path: TreePath, tallestSibling: number) {
        const visibleHeader: AddedVisibleHeader<TData> = {
            key: `header_${header.id}`,
            span: 1,
            height: 0,
            column: header.column
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
                    column: null
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
                column: null
            });

        return visibleHeader;
    }

    for (const column of state.headers.iterator())
        addHeader(column, [headerRows.at(-1)!.length], headerRows.length - 1);

    return <table
        className="rst-table rst-head"
        aria-hidden={true}
        ref={refs.head.set}
    >
        <ColGroup />
        <thead>
        {headerRows.map((_, level) => {
            const height = heightOfRowLevel(level);
            const headers = headerRows[height];
            return <tr className="rst-row" key={height}>
                {headers.map((info, index) =>
                    <TableHeader key={info.key}
                                 span={info.span}
                                 column={info.column}
                                 addResizer={index > 0}
                    />)}
                <th className="rst-spacer">
                    <ColumnResizer type={ResizerType.Normal} />
                    <ColumnResizer type={ResizerType.Edge} />
                </th>
            </tr>;
        })}
        </thead>
    </table>;
}


export default TableHead;