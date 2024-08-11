import {
    Column,
    LeafColumn,
    ColumnGroup,
    isColumnGroup
} from '../../utils/columnUtils';
import { TreePath } from '../../utils/unrootedTreeUtils';
import { Event } from '../Observable';
import { Config, TableData } from '../../utils/configUtils';
import JobBatch from '../JobBatch';

export type LeafHeaderUpdate<TData extends TableData> = {
    type: 'add';
    position: number;
    columns: LeafColumn<TData['row']>[];
} | {
    type: 'remove';
    position: number;
    count: number;
};

interface BaseHeader {
    readonly id: HeaderId;
}

interface HeaderGroup<TData extends TableData> extends BaseHeader {
    readonly column: ColumnGroup<TData['row']>;
    readonly children: Header<TData>[];
}

interface LeafHeader<TData extends TableData> extends BaseHeader {
    readonly column: LeafColumn<TData['row']>;
    readonly children: null;
}

interface BaseReadonlyHeader {
    readonly id: HeaderId;
}

interface ReadonlyHeaderGroup<TData extends TableData> extends BaseReadonlyHeader {
    readonly column: ColumnGroup<TData['row']>;
    readonly children: ReadonlyHeaderIterator<TData>;
}

interface ReadonlyLeafHeader<TData extends TableData> extends BaseReadonlyHeader {
    readonly column: LeafColumn<TData['row']>;
    readonly children: null;
}


type Header<TData extends TableData> = HeaderGroup<TData> | LeafHeader<TData>;

export type HeaderId = number;

export type SortOrder = 'ascending' | 'descending';
export type NewSortOrder = SortOrder | null | 'toggle' | 'cycle';

export type ReadonlyHeader<TData extends TableData> = ReadonlyLeafHeader<TData> | ReadonlyHeaderGroup<TData>;
export type ReadonlyHeaderIterator<TData extends TableData> = Generator<ReadonlyHeader<TData>, void, undefined>
export type ReadonlyLeafHeaderIterator<TData extends TableData> = Generator<ReadonlyLeafHeader<TData>, void, undefined>

let lastHeaderId = 0;

function isHeaderGroup<TData extends TableData>(details: Header<TData>): details is HeaderGroup<TData> {
    return isColumnGroup(details.column);
}

function isReadonlyHeaderGroup<TData extends TableData>(header: ReadonlyHeader<TData>): header is ReadonlyHeaderGroup<TData> {
    return !!header.children;
}

export default class HeaderState<TData extends TableData> {
    readonly #headers: Header<TData>[] = [];

    readonly leafChanged = new Event<LeafHeaderUpdate<TData>>();
    readonly changed = new Event();

    constructor(private _config: Config<TData>, private _jobBatch: JobBatch) {

    }

    #atPath(path: TreePath): Header<TData> {
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

    #addAllSubHeaders(header: Header<TData>): LeafColumn<TData['row']>[] {
        if (!header.children) return [header.column];

        const addedLeafColumns: LeafColumn<TData['row']>[] = [];
        for (let i = 0; i <= header.column.children.length - 1; i++) {
            const toAdd = this.#create(header.column.children[i]);
            header.children.push(toAdd);

            if (toAdd.children == null) {
                addedLeafColumns.push(toAdd.column);
                continue;
            }

            addedLeafColumns.push(...this.#addAllSubHeaders(toAdd));
        }

        return addedLeafColumns;
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

    * #iterator(headers: Header<TData>[]): ReadonlyHeaderIterator<TData> {
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            if (isHeaderGroup(header))
                yield {
                    id: header.id,
                    column: header.column,
                    children: this.#iterator(header.children)
                };
            else
                yield {
                    id: header.id,
                    column: header.column,
                    children: null
                };
        }
    }

    * #leafIterator(headers: ReadonlyHeaderIterator<TData>): ReadonlyLeafHeaderIterator<TData> {
        for (const header of headers) {
            if (isReadonlyHeaderGroup(header))
                yield* this.#leafIterator(header.children);
            else
                yield header;
        }
    }

    #notifyChangedJob = () => {
        this.changed.notify();
    };

    iterator() {
        return this.#iterator(this.#headers);
    }

    leafIterator() {
        return this.#leafIterator(this.iterator());
    }

    add(headerPath: TreePath, columnPath: TreePath) {
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
            columns: this.#addAllSubHeaders(lastToAdd),
            position: this.#getLeafIndex(toAdd)
        });

        this._jobBatch.add(this.#notifyChangedJob);
    };

    getColumnAtPath(path: TreePath): Column<TData['row']> {
        return this.#atPath(path).column;
    }
}