import { Column, ColumnGroup, isColumnGroup, LeafColumn } from '../../utils/columnUtils';
import { TreePath } from '../../utils/unrootedTreeUtils';
import Observable from '../Observable';
import { TableData } from '../../utils/configUtils';
import { getIterableIterator } from '../../utils/iterableUtils';
import SchedulerSlice from './SchedulerSlice';
import { optional } from '../../utils/types';
import ColumnSlice, { NewSortOrder } from './ColumnSlice';
import UndoableStateSlice from '../UndoableStateSlice';
import { pushReverse, remove } from '../../utils/arrayUtils';

interface Dependencies<TData extends TableData> {
    scheduler: SchedulerSlice;
    columns: ColumnSlice<TData>;
}

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

interface ColumnIndexNode {
    index: number;
    children?: ColumnIndexNode[];
}

type Header<TData extends TableData> = HeaderGroup<TData> | LeafHeader<TData>;
export type ReadonlyHeader<TData extends TableData> = ReadonlyLeafHeader<TData> | ReadonlyHeaderGroup<TData>;

export type HeaderId = number;

let lastHeaderId = 0;

function isHeaderGroup<TData extends TableData>(details: Header<TData>): details is HeaderGroup<TData> {
    return isColumnGroup(details.column);
}

export default class HeaderSlice<TData extends TableData> extends UndoableStateSlice<Dependencies<TData>, object> {
    readonly #headers: Header<TData>[] = [];

    get #columns() {
        return this._state.columns.config;
    }

    protected readonly _sliceKey = 'headers';

    readonly added = new Observable<ReadonlyLeafHeader<TData>[]>();
    readonly changed = new Observable();

    #getAtPath(path: TreePath): Header<TData> {
        let headers = this.#headers;
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

    #getChildrenAtPath(path: TreePath) {
        let columns = this.#columns;
        let headers = this.#headers;

        for (const index of path) {
            const header = headers[index];
            if (header?.children == null)
                throw new Error('Invalid header path');

            headers = header.children;
            columns = header.column.children;
        }

        return { headers, columns };
    }

    #getChildren(header: Header<TData>) {
        return { headers: header.children, columns: header.column.children };
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

    #addSubHeaders(header: Header<TData>, columns: ColumnIndexNode[] | undefined): ReadonlyLeafHeader<TData>[] {
        if (!header.children) return [header];
        if (!columns) return this.#addAllSubHeaders(header);

        const addedLeafHeaders: ReadonlyLeafHeader<TData>[] = [];
        for (const column of columns) {
            const toAdd = this.#create(header.column.children[column.index]);
            header.children.push(toAdd);

            if (toAdd.children == null) {
                addedLeafHeaders.push(toAdd);
                continue;
            }

            addedLeafHeaders.push(...this.#addSubHeaders(toAdd, column.children));
        }

        return addedLeafHeaders;
    }

    #getLeafColumnIndices(header: Header<TData>): ColumnIndexNode[] | undefined {
        if (!header.children) return;

        const indexNodes: ColumnIndexNode[] = [];
        for (const child of header.children) {
            indexNodes.push({
                index: header.column.children.indexOf(child.column),
                children: this.#getLeafColumnIndices(child)
            });
        }

        return indexNodes;
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

    add = this._dispatcher('add', toUndo => (columnPath: TreePath, headerPath: TreePath) => {
        if (columnPath.length === 0)
            throw new Error('Empty column path given');

        if (headerPath.length === 0)
            headerPath = [this.#headers.length];

        const { columns, headers } = this.#getChildrenAtPath(headerPath.slice(0, -1));

        const toAdd = this.#create(columns[columnPath[0]]);
        let lastToAdd = toAdd;

        for (let pathIndex = 1; pathIndex < columnPath.length; pathIndex++) {
            if (lastToAdd.children == null)
                throw new Error('Invalid column path');

            const columnIndex = columnPath[pathIndex];
            const toAdd = this.#create(lastToAdd.column.children[columnIndex]);

            lastToAdd.children.push(toAdd);
            lastToAdd = toAdd;
        }

        const addedLeafHeaders = this.#addAllSubHeaders(lastToAdd);
        headers.splice(headerPath[headerPath.length - 1], 0, toAdd);

        this.added.notify(addedLeafHeaders);
        toUndo(this.remove.action(headerPath));

        this._state.scheduler._add(this.#notifyChangedJob);
    });

    addMany = this._dispatcher('addMany', toUndo => (columnIndices: ColumnIndexNode, headerPath: TreePath) => {
        if (headerPath.length === 0)
            headerPath = [this.#headers.length];

        const { headers, columns } = this.#getChildrenAtPath(headerPath.slice(0, -1));
        const toAdd = this.#create(columns[columnIndices.index]);

        const addedLeafHeaders = this.#addSubHeaders(toAdd, columnIndices.children);
        headers.splice(headerPath[headerPath.length - 1], 0, toAdd);

        this.added.notify(addedLeafHeaders);
        toUndo(this.remove.action(headerPath));

        this._state.scheduler._add(this.#notifyChangedJob);
    });

    remove = this._dispatcher('remove', toUndo => (headerPath: TreePath) => {
        const headerTrail: { columnIndex: number, index: number, siblings: Header<TData>[] }[] = [];

        // Step 1: Go down to find the header
        let columns = optional(this.#columns);
        let headers = this.#headers;
        let header: Header<TData> | null = null;

        for (const index of headerPath) {
            header = headers[index];
            if (header == null)
                throw new Error('Invalid path');

            headerTrail.push({
                index: index,
                columnIndex: columns!.indexOf(header.column),
                siblings: headers
            });

            headers = header.children ?? [];
            columns = header.column.children;
        }

        // Step 2: Go down to find leaf headers
        if (header == null) throw new Error('Empty path');
        let removedColumnIndices = this.#getLeafColumnIndices(header);

        // Step 3: Go up deleting empty parents
        while (headerTrail.length) {
            const headerInfo = headerTrail.pop()!;
            removedColumnIndices = [{
                index: headerInfo.columnIndex,
                children: removedColumnIndices
            }];

            headerInfo.siblings.splice(headerInfo.index, 1);
            if (headerInfo.siblings.length) break;

            headerPath.pop();
        }

        toUndo(this.addMany.action(removedColumnIndices![0], headerPath));

        this._state.scheduler._add(this.#notifyChangedJob);
    });

    sortBy = this._dispatcher('sortBy', toUndo => (path: TreePath, newOrder: NewSortOrder, append: boolean) => {
        this._state.columns._sortByColumn.notify({
            column: this.#getAtPath(path).column,
            newOrder,
            append,
            toUndo: oldOrder => toUndo(this.sortBy.action(path, oldOrder, append))
        });
    });
}