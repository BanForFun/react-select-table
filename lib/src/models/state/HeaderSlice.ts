import {
    Column,
    LeafColumn,
    ColumnGroup,
    isColumnGroup
} from '../../utils/columnUtils';
import { TreePath } from '../../utils/unrootedTreeUtils';
import { Event } from '../Observable';
import { TableData } from '../../utils/configUtils';
import { getIterableIterator } from '../../utils/iterableUtils';
import StateSlice from '../StateSlice';
import SchedulerSlice from './SchedulerSlice';

interface HeaderConfig<TData extends TableData> {
    columns: Column<TData['row']>[];
}

interface Dependencies {
    scheduler: SchedulerSlice;
}

export type LeafHeaderUpdate<TData extends TableData> = {
    type: 'add' | 'remove';
    position: number;
    headers: ReadonlyLeafHeader<TData>[];
};

interface BaseReadonlyHeader {
    readonly id: HeaderId;
}

interface ReadonlyHeaderGroup<TData extends TableData> extends BaseReadonlyHeader {
    readonly column: ColumnGroup<TData['row']>;
    readonly children: Iterable<ReadonlyHeader<TData>>;
}

interface ReadonlyLeafHeader<TData extends TableData> extends BaseReadonlyHeader {
    readonly column: LeafColumn<TData['row']>;
    readonly children: null;
}

interface HeaderGroup<TData extends TableData> extends ReadonlyHeaderGroup<TData> {
    readonly children: Header<TData>[];
}

interface LeafHeader<TData extends TableData> extends ReadonlyLeafHeader<TData> {

}

type Header<TData extends TableData> = HeaderGroup<TData> | LeafHeader<TData>;
export type ReadonlyHeader<TData extends TableData> = ReadonlyLeafHeader<TData> | ReadonlyHeaderGroup<TData>;

export type HeaderId = number;

export type SortOrder = 'ascending' | 'descending';
export type NewSortOrder = SortOrder | null | 'toggle' | 'cycle';

let lastHeaderId = 0;

function isHeaderGroup<TData extends TableData>(details: Header<TData>): details is HeaderGroup<TData> {
    return isColumnGroup(details.column);
}

export default class HeaderSlice<TData extends TableData> extends StateSlice<HeaderConfig<TData>, Dependencies> {
    readonly #headers: Header<TData>[] = [];

    readonly leafChanged = new Event<LeafHeaderUpdate<TData>>();
    readonly changed = new Event();

    #create(basedOn: Column<TData['row']>): Header<TData> {
        if (basedOn == null)
            throw new Error('Invalid base column');

        if (isColumnGroup(basedOn)) return {
            id: ++lastHeaderId,
            column: basedOn,
            children: []
        };

        return {
            id: ++lastHeaderId,
            column: basedOn,
            children: null
        };
    }

    #addAllSubHeaders(header: Header<TData>): ReadonlyLeafHeader<TData>[] {
        if (!header.children) return [header];

        const addedLeafHeaders: ReadonlyLeafHeader<TData>[] = [];
        for (let i = 0; i <= header.column.children.length - 1; i++) {
            const toAdd = this.#create(header.column.children[i]);
            header.children.push(toAdd);

            if (toAdd.children == null) {
                addedLeafHeaders.push(toAdd);
                continue;
            }

            addedLeafHeaders.push(...this.#addAllSubHeaders(toAdd));
        }

        return addedLeafHeaders;
    }

    #getLeafIndex(header: Header<TData>): number {
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

    * #leafIterator(headers: Header<TData>[]): IterableIterator<ReadonlyLeafHeader<TData>> {
        for (const header of headers) {
            if (isHeaderGroup(header))
                yield* this.#leafIterator(header.children);
            else
                yield header;
        }
    }

    #notifyChangedJob = () => {
        this.changed.notify();
    };

    iterator() {
        return getIterableIterator(this.#headers);
    }

    leafIterator() {
        return this.#leafIterator(this.#headers);
    }

    add(headerPath: TreePath, columnPath: TreePath) {
        if (columnPath.length === 0)
            throw new Error('Empty column path given');

        if (columnPath.length < headerPath.length)
            throw new Error('Cannot merge column groups');

        let columns = this.config.columns;
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
        const toAdd = this.#create(columns[addedColumnIndex]);
        let lastToAdd = toAdd;

        for (let pathIndex = headerPath.length; pathIndex < columnPath.length; pathIndex++) {
            if (lastToAdd.children == null)
                throw new Error('Column path too long');

            const columnIndex = columnPath[pathIndex];
            const toAdd = this.#create(lastToAdd.column.children[columnIndex]);

            lastToAdd.children.push(toAdd);
            lastToAdd = toAdd;
        }

        const addedHeaderIndex = headerPath[headerPath.length - 1];
        headers.splice(addedHeaderIndex, 0, toAdd);

        this.leafChanged.notify({
            type: 'add',
            headers: this.#addAllSubHeaders(lastToAdd),
            position: this.#getLeafIndex(toAdd)
        });

        this._state.scheduler._add(this.#notifyChangedJob);
    };

    getAtPath(path: TreePath): ReadonlyHeader<TData> {
        let headers: Header<TData>[] = this.#headers;
        let header: Header<TData> | null = null;

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

    getColumnAtPath(path: TreePath): Column<TData['row']> {
        let columns: Column<TData['row']>[] = this.config.columns;
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
}