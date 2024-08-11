import {
    Column,
    LeafColumn,
    ColumnGroup,
    isColumnGroup
} from '../../utils/columnUtils';
import { TreePath } from '../../utils/unrootedTreeUtils';
import { Event } from '../Observable';
import { Config, TableData } from '../../utils/configUtils';
import { PickRequired } from '../../utils/types';
import { indexOf } from '../../utils/iterableUtils';
import JobBatch from '../JobBatch';

export type ColumnUpdate<TData extends TableData> = {
    type: 'add';
    addedPosition: number;
    addedColumns: LeafColumn<TData['row']>[];
} | {
    type: 'remove';
    removedPosition: number;
    removedCount: number;
};

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

interface BaseHeader {
    readonly id: number;
}

interface HeaderGroup<TData extends TableData> extends BaseHeader {
    readonly column: ColumnGroup<TData['row']>;
    readonly children: HeaderIterator<TData>;
}

interface LeafHeader<TData extends TableData> extends BaseHeader {
    readonly column: LeafColumn<TData['row']>;
    readonly children: null;
    readonly sortColumn?: SortColumn | null;
    readonly width: number;
}

type SortableColumn<TContext> = PickRequired<LeafColumn<TContext>, 'compareContext'>

type HeaderDetails<TData extends TableData> = HeaderGroupDetails<TData> | LeafHeaderDetails<TData>;

export type SortOrder = 'ascending' | 'descending';
export type NewSortOrder = SortOrder | null | 'toggle' | 'cycle';

export type Header<TData extends TableData> = LeafHeader<TData> | HeaderGroup<TData>;
export type SortableHeader<TData extends TableData> = PickRequired<LeafHeader<TData>, 'sortColumn'>
export type HeaderIterator<TData extends TableData> = Generator<Header<TData>, void, undefined>
export type LeafHeaderIterator<TData extends TableData> = Generator<LeafHeader<TData>, void, undefined>

let lastHeaderId = 0;

function isSortableColumn<TContext>(column: Column<TContext>): column is SortableColumn<TContext> {
    return !isColumnGroup(column) && column.compareContext !== undefined;
}

function isHeaderGroupDetails<TData extends TableData>(details: HeaderDetails<TData>): details is HeaderGroupDetails<TData> {
    return isColumnGroup(details.column);
}

function isHeaderGroup<TData extends TableData>(header: Header<TData>): header is HeaderGroup<TData> {
    return !!header.children;
}

export function isSortableHeader<TData extends TableData>(header: Header<TData>): header is SortableHeader<TData> {
    return !isHeaderGroup(header) && header.sortColumn !== undefined;
}

export default class ColumnState<TData extends TableData> {
    readonly #sortOrders = new Map<SortableColumn<TData['row']>, SortOrder>();
    readonly #headers: HeaderDetails<TData>[] = [];

    readonly columnsChanged = new Event<ColumnUpdate<TData>>();
    readonly headersChanged = new Event();
    readonly sortOrdersChanged = new Event();

    constructor(private _config: Config<TData>, private _jobBatch: JobBatch) {

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

    * #headerIterator(headers: HeaderDetails<TData>[]): HeaderIterator<TData> {
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            if (isHeaderGroupDetails(header))
                yield {
                    id: header.id,
                    column: header.column,
                    children: this.#headerIterator(header.children)
                };
            else
                yield {
                    id: header.id,
                    column: header.column,
                    children: null,
                    sortColumn: isSortableColumn(header.column) ? this.#getSortColumn(header.column) : undefined,
                    width: header.width
                };
        }
    }

    * #leafHeaderIterator(headers: HeaderIterator<TData>): LeafHeaderIterator<TData> {
        for (const header of headers) {
            if (isHeaderGroup(header))
                yield* this.#leafHeaderIterator(header.children);
            else
                yield header;
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

    #refreshHeadersJob = () => {
        this.headersChanged.notify();
    };

    #refreshSortOrdersJob = () => {
        this.headersChanged.notify();
        this.sortOrdersChanged.notify();
    };

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

        this._jobBatch.add(this.#refreshSortOrdersJob);

        return oldOrder;
    }

    headerIterator() {
        return this.#headerIterator(this.#headers);
    }

    leafHeaderIterator() {
        return this.#leafHeaderIterator(this.headerIterator());
    }

    addHeader(headerPath: TreePath, columnPath: TreePath) {
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

        this.columnsChanged.notify({
            type: 'add',
            addedColumns: this.#addAllSubHeaders(lastToAdd),
            addedPosition: this.#getLeafHeaderIndex(toAdd)
        });

        this._jobBatch.add(this.#refreshHeadersJob);
    };

    removeHeader(path: TreePath) {

    }

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