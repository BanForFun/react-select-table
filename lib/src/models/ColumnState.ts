import {
    Column,
    LeafColumn,
    ColumnGroup,
    isColumnGroup
} from '../utils/columnUtils';
import { TreePath } from '../utils/unrootedTreeUtils';
import Command, { Event } from './Command';
import React from 'react';
import { Config, TableData } from '../utils/configUtils';
import { PickRequired } from '../utils/types';
import { indexOf } from '../utils/iterableUtils';

export type UpdateHeaderEventArgs<TData extends TableData> = {
    addedPosition: number,
    addedColumns: LeafColumn<TData['row']>[]
} | {
    removedPosition: number;
    removedCount: number;
};

export type SortOrder = 'ascending' | 'descending';
export type NewSortOrder = SortOrder | null | 'toggle' | 'cycle';

export interface SortColumn {
    order: SortOrder;
    index: number;
}

interface BaseHeaderDetails {
    readonly id: number;
}

interface HeaderGroupDetails<TData extends TableData> extends BaseHeaderDetails {
    readonly column: ColumnGroup<TData['row']>;
    readonly children: HeaderDetails<TData>[];
}

interface LeafHeaderDetails<TData extends TableData> extends BaseHeaderDetails {
    readonly column: LeafColumn<TData['row']>;
    readonly children: null;
    width: number;
}

type HeaderDetails<TData extends TableData> = HeaderGroupDetails<TData> | LeafHeaderDetails<TData>;

interface BaseHeader {
    readonly id: number;
    readonly content: React.ReactNode;
}

interface BaseLeafHeader extends BaseHeader {
    readonly children: null;
}

interface UnSortableLeafHeader extends BaseLeafHeader {
    readonly isSortable: false;
}

interface SortableLeafHeader extends BaseLeafHeader {
    readonly isSortable: true;
    readonly sortColumn: SortColumn | null;
}

interface HeaderGroup extends BaseHeader {
    readonly children: HeaderIterator;
}

export type Header = SortableLeafHeader | UnSortableLeafHeader | HeaderGroup;

type HeaderIterator = Generator<Header, void, undefined>

export type SortableColumn<TContext> = PickRequired<LeafColumn<TContext>, 'compareContext'>

let lastHeaderId = 0;

function isSortableColumn<TContext>(column: Column<TContext>): column is SortableColumn<TContext> {
    return !isColumnGroup(column) && !!column.compareContext;
}

function isHeaderGroupDetails<TData extends TableData>(details: HeaderDetails<TData>): details is HeaderGroupDetails<TData> {
    return isColumnGroup(details.column);
}

function isHeaderGroup(header: Header): header is HeaderGroup {
    return !!header.children;
}

export function isSortableHeader(header: Header): header is SortableLeafHeader {
    return !isHeaderGroup(header) && header.isSortable;
}

export default class ColumnState<TData extends TableData> {
    readonly #sortOrders = new Map<SortableColumn<TData['row']>, SortOrder>();
    readonly #headers: HeaderDetails<TData>[] = [];

    readonly updateHeader = new Event<UpdateHeaderEventArgs<TData>>();
    readonly refreshHeader = new Command();

    constructor(private _config: Config<TData>) {

    }

    #getHeaderAtPath(path: TreePath): HeaderDetails<TData> {
        let headers: HeaderDetails<TData>[] = this.#headers;
        let header: HeaderDetails<TData> | null = null;

        for (const index of path) {
            header = headers[index];
            if (header == null)
                throw new Error('Invalid path');

            headers = header.children ?? [];
        }

        if (header == null)
            throw new Error('Empty path given');

        return header;
    }

    #getColumnAtPath(path: TreePath): Column<TData['row']> {
        let columns: Column<TData['row']>[] = this._config.columns;
        let column: Column<TData['row']> | null = null;

        for (const index of path) {
            column = columns[index];
            if (column == null)
                throw new Error('Invalid path');

            columns = column.children ?? [];
        }

        if (column == null)
            throw new Error('Empty path given');

        return column;
    }

    #createHeader(basedOn: Column<TData['row']>): HeaderDetails<TData> {
        if (basedOn == null)
            throw new Error('Invalid base column');

        if (isColumnGroup(basedOn)) return {
            id: ++lastHeaderId,
            column: basedOn,
            children: []
        };

        return {
            id: ++lastHeaderId,
            width: this._config.defaultColumnWidthPercentage,
            column: basedOn,
            children: null
        };
    }

    #addAllSubHeaders(header: HeaderDetails<TData>): LeafColumn<TData['row']>[] {
        if (!header.children) return [header.column];

        const addedLeafColumns: LeafColumn<TData['row']>[] = [];
        for (let i = 0; i <= header.column.children.length - 1; i++) {
            const toAdd = this.#createHeader(header.column.children[i]);
            header.children.push(toAdd);

            if (toAdd.children == null) {
                addedLeafColumns.push(toAdd.column);
                continue;
            }

            addedLeafColumns.push(...this.#addAllSubHeaders(toAdd));
        }

        return addedLeafColumns;
    }

    #getLeafHeaderIndex(header: HeaderDetails<TData>): number {
        let index = 0;
        const headerStack = [...this.#headers];
        while (headerStack.length) {
            const current = headerStack.pop()!;
            if (current === header) return index;

            if (!current.children) {
                index++;
                continue;
            }

            for (let i = current.children.length - 1; i >= 0; i--)
                headerStack.push(current.children[i]);
        }

        return -1;
    }

    #getSortColumn(column: SortableColumn<TData['row']>): SortColumn | null {
        const order = this.#sortOrders.get(column);
        if (order == null) return null;

        return { index: indexOf(this.#sortOrders.keys(), column), order };
    }

    * #headerIterator(headers: HeaderDetails<TData>[]): HeaderIterator {
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            if (isHeaderGroupDetails(header))
                yield {
                    id: header.id,
                    content: header.column.header,
                    children: this.#headerIterator(header.children)
                };
            else if (isSortableColumn(header.column))
                yield {
                    id: header.id,
                    content: header.column.header,
                    children: null,
                    isSortable: true,
                    sortColumn: this.#getSortColumn(header.column)
                };
            else
                yield {
                    id: header.id,
                    content: header.column.header,
                    children: null,
                    isSortable: false
                };
        }
    }

    #resolveSortOrder(newOrder: NewSortOrder, oldOrder: SortOrder | null): SortOrder | null {
        switch (newOrder) {
            case 'toggle':
                if (oldOrder !== 'ascending')
                    return 'ascending';

                return 'descending';
            case 'cycle':
                if (oldOrder == null)
                    return 'ascending';

                if (oldOrder === 'ascending')
                    return 'descending';

                return null;
            default:
                return newOrder;
        }
    }

    #sortBy(column: Column<TData['row']>, newOrder: NewSortOrder, append: boolean) {
        if (!isSortableColumn(column))
            throw new Error('Cannot sort by this column');

        const oldOrder = this.#sortOrders.get(column) ?? null;
        const resolvedOrder = this.#resolveSortOrder(newOrder, oldOrder);

        if (!append)
            this.#sortOrders.clear();

        if (resolvedOrder == null)
            this.#sortOrders.delete(column);
        else
            this.#sortOrders.set(column, resolvedOrder);

        this.refreshHeader.notify();
        return oldOrder;
    }

    headerIterator() {
        return this.#headerIterator(this.#headers);
    }

    addHeader(columnPath: TreePath, headerPath: TreePath) {
        if (columnPath.length === 0)
            throw new Error('Empty column path given');

        if (columnPath.length < headerPath.length)
            throw new Error('Cannot merge column groups');

        let columns = this._config.columns;
        let headers = this.#headers;
        for (let pathIndex = 0; pathIndex < headerPath.length - 1; pathIndex++) {
            const columnIndex = columnPath[pathIndex];
            const column = columns[columnIndex];

            if (column?.children == null)
                throw new Error('Invalid column path');

            const headerIndex = headerPath[pathIndex];
            const header = headers[headerIndex];

            if (header?.children == null)
                throw new Error('Invalid header path');

            if (header.column !== column)
                throw new Error('Incompatible column group');

            headers = header.children;
            columns = column.children;
        }

        const addedColumnIndex = columnPath[headerPath.length - 1];
        const toAdd = this.#createHeader(columns[addedColumnIndex]);
        let lastToAdd = toAdd;

        for (let pathIndex = headerPath.length; pathIndex < columnPath.length; pathIndex++) {
            if (lastToAdd.children == null)
                throw new Error('Column path too long');

            const columnIndex = columnPath[pathIndex];
            const toAdd = this.#createHeader(lastToAdd.column.children[columnIndex]);

            lastToAdd.children.push(toAdd);
            lastToAdd = toAdd;
        }

        const addedHeaderIndex = headerPath[headerPath.length - 1];
        headers.splice(addedHeaderIndex, 0, toAdd);

        this.updateHeader.notify({
            addedColumns: this.#addAllSubHeaders(lastToAdd),
            addedPosition: this.#getLeafHeaderIndex(toAdd)
        });
    };

    compareRowData(a: TData['row'], b: TData['row']) {
        for (const [column, order] of this.#sortOrders) {
            const result = column.compareContext(a, b);
            if (result === 0) continue;

            if (order === 'descending')
                return result * -1;

            return result;
        }

        return 0;
    }

    sortByColumn(path: TreePath, newOrder: NewSortOrder, append: boolean) {
        return this.#sortBy(this.#getColumnAtPath(path), newOrder, append);
    }

    sortByHeader(path: TreePath, newOrder: NewSortOrder, append: boolean) {
        return this.#sortBy(this.#getHeaderAtPath(path).column, newOrder, append);
    }
}