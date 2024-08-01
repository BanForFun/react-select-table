import { Controller } from '../index';
import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { commandsSymbol } from '../models/Controller';
import { CommandArgs } from '../models/Commands';
import { VisibleColumn } from '../models/VisibleColumnsSlice';

interface Header {
    key: string;
    span: number;
    content: React.ReactNode;
}

interface AddedHeader extends Header {
    height: number;
}

interface Props<TRow, TFilter> {
    controller: Controller<TRow, TFilter>;
}

export default function TableHead<TRow, TFilter>({ controller }: Props<TRow, TFilter>) {
    const queuedUpdatesRef = useRef<CommandArgs<TRow>['updateHeader'][]>([]);
    const [updates, setUpdates] = useState<CommandArgs<TRow>['updateHeader'][]>([]);

    useEffect(() => {
        return controller[commandsSymbol].updateHeader.addObserver(args => {
            queuedUpdatesRef.current.push(args);
            setUpdates(queuedUpdatesRef.current);
        });
    }, [controller]);

    useLayoutEffect(() => {
        console.log('Applying', updates.length, 'updates');
        queuedUpdatesRef.current = [];
    }, [updates]);

    const headerRows: Header[][] = [[]];
    const heightOfRowLevel = (level: number) => headerRows.length - 1 - level;

    function addHeader(column: VisibleColumn<TRow>, siblingIndex: number, tallestSibling: number): AddedHeader {
        const header: AddedHeader = { key: `header_${column.id}`, content: column.info.header, span: 1, height: 0 };

        let childCount = 0;
        if (column.visibleChildren) {
            let tallestChild = 0;
            let totalSpan = 0;

            for (const child of column.visibleChildren) {
                const header = addHeader(child, childCount++, tallestChild);
                tallestChild = Math.max(tallestChild, header.height);
                totalSpan += header.span;
            }

            header.height = tallestChild + 1;
            header.span = totalSpan;
        }

        const addSpacers = (siblingsOnly: boolean = false) => {
            const bottomRow = headerRows[header.height - 1];

            const endIndex = bottomRow.length - childCount;
            const startIndex = siblingsOnly ? endIndex - siblingIndex : 0;

            for (let i = startIndex; i < endIndex; i++) {
                const column = bottomRow[i];
                headerRows[header.height].push({ key: `spacer_${column.key}`, span: column.span, content: null });
            }
        };

        if (header.height >= headerRows.length) {
            headerRows.push([]);
            addSpacers();
        } else if (header.height > tallestSibling) {
            addSpacers(true);
        }

        headerRows[header.height].push(header);

        for (let height = header.height + 1; height <= tallestSibling; height++)
            headerRows[height].push({ key: `spacer_${header.key}`, span: header.span, content: null });

        return header;
    }

    for (const column of controller.state.visibleColumns.iterator())
        addHeader(column, headerRows.at(-1)!.length, headerRows.length - 1);

    return <div className="rst-table">
        <table>
            <thead>
            {headerRows.map((_, level) => {
                const height = heightOfRowLevel(level);
                const headers = headerRows[height];
                return <tr key={height}>
                    {headers.map(header => <th key={header.key} colSpan={header.span}>{header.content}</th>)}
                </tr>;
            })}
            </thead>
        </table>
    </div>;
}