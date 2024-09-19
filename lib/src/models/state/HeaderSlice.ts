import { Column, ColumnGroup, isColumnGroup, LeafColumn } from '../../utils/columnUtils';
import { getAtPath, TreePath } from '../../utils/unrootedTreeUtils';
import Observable from '../Observable';
import { TableData } from '../../utils/configUtils';
import { getIterableIterator } from '../../utils/iterableUtils';
import SchedulerSlice from './SchedulerSlice';
import { optional } from '../../utils/types';
import ColumnSlice from './ColumnSlice';
import UndoableStateSlice from '../UndoableStateSlice';
import HistorySlice from './HistorySlice';

interface Dependencies<TData extends TableData> {
    scheduler: SchedulerSlice;
    columns: ColumnSlice<TData>;
    history: HistorySlice;
}

interface BaseReadonlyHeader {
    readonly id: HeaderId;
}

export interface ReadonlyHeaderGroup<TData extends TableData> extends BaseReadonlyHeader {
    readonly column: ColumnGroup<TData['row']>;
    readonly children: Iterable<ReadonlyHeader<TData>>;
}

export interface ReadonlyLeafHeader<TData extends TableData> extends BaseReadonlyHeader {
    readonly column: LeafColumn<TData['row']>;
    readonly children?: never;
}

interface HeaderGroup<TData extends TableData> extends ReadonlyHeaderGroup<TData> {
    readonly children: Header<TData>[];
}

interface LeafHeader<TData extends TableData> extends ReadonlyLeafHeader<TData> {

}

export interface HeaderCell<TData extends TableData> {
    id: number;
    span: number;
    height: number;
    column?: Column<TData['row']>;
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
    rows: HeaderCell<TData>[][] = [[]];

    get #columns() {
        return this._state.columns.config;
    }

    protected readonly _sliceKey = 'headers';

    readonly _added = new Observable<[ReadonlyLeafHeader<TData>[]]>();
    readonly rowsChanged = new Observable();

    #getAtPath(path: TreePath): Header<TData> {
        return getAtPath(this.#headers, path);
    }

    #getChildrenAtPath(path: TreePath) {
        if (path.length === 0)
            return { headers: this.#headers, columns: this.#columns };

        const header = this.#getAtPath(path);
        if (!isHeaderGroup(header))
            throw new Error('Leaf nodes do not have children');

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
            column: basedOn
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

    #addSpacerCell(cell: HeaderCell<TData>, height: number) {
        const spacer: HeaderCell<TData> = {
            id: cell.id,
            span: cell.span,
            height
        };

        this.rows[spacer.height].push(spacer);
        return spacer;
    }

    #addColumnCell(header: ReadonlyHeader<TData>, siblingIndex: number, tallestSiblingHeight: number) {
        const cell: HeaderCell<TData> = {
            id: header.id,
            span: 1,
            height: 0,
            column: header.column
        };

        let childCount = 0;
        if (header.children) {
            let tallestChild = 0;
            let totalSpan = 0;

            for (const child of header.children) {
                const cell = this.#addColumnCell(child, childCount++, tallestChild);
                tallestChild = Math.max(tallestChild, cell.height);
                totalSpan += cell.span;
            }

            cell.height = tallestChild + 1;
            cell.span = totalSpan;
        }

        if (cell.height >= this.rows.length) this.rows.push([]);
        const row = this.rows[cell.height];

        if (cell.height > tallestSiblingHeight) {
            const bottomRow = this.rows[cell.height - 1];
            const endIndex = bottomRow.length - childCount;
            const startIndex = row.length ? endIndex - siblingIndex : 0;

            for (let i = startIndex; i < endIndex; i++)
                this.#addSpacerCell(bottomRow[i], cell.height);
        }

        row.push(cell);

        for (let height = cell.height + 1; height <= tallestSiblingHeight; height++)
            this.#addSpacerCell(cell, height);

        return cell;
    }

    #rebuildHeaderRowsJob = () => {
        this.rows = [[]];
        for (const header of this.iterator()) {
            const maxHeight = this.rows.length - 1;
            this.#addColumnCell(header, this.rows[maxHeight].length, maxHeight);
        }
        
        this.rowsChanged.notify();
    };

    iterator() {
        return getIterableIterator(this.#headers);
    }

    leafIterator() {
        return this.#leafIterator(this.#headers);
    }

    add = this._dispatcher('add', (toUndo, columnPath: TreePath, headerPath: TreePath) => {
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

        this._added.notify(addedLeafHeaders);
        toUndo(this.remove.action(headerPath));

        this._state.scheduler._add(this.#rebuildHeaderRowsJob);
    });

    addMany = this._dispatcher('addMany', (toUndo, columnIndices: ColumnIndexNode, headerPath: TreePath) => {
        if (headerPath.length === 0)
            headerPath = [this.#headers.length];

        const { headers, columns } = this.#getChildrenAtPath(headerPath.slice(0, -1));
        const toAdd = this.#create(columns[columnIndices.index]);

        const addedLeafHeaders = this.#addSubHeaders(toAdd, columnIndices.children);
        headers.splice(headerPath[headerPath.length - 1], 0, toAdd);

        this._added.notify(addedLeafHeaders);
        toUndo(this.remove.action(headerPath));

        this._state.scheduler._add(this.#rebuildHeaderRowsJob);
    });

    remove = this._dispatcher('remove', (toUndo, headerPath: TreePath) => {
        const headerTrail: { index: number, header: Header<TData>, siblings: Header<TData>[] }[] = [];

        // Step 1: Go down to find the header
        let headers = optional(this.#headers);
        let header: Header<TData> | undefined;

        for (const index of headerPath) {
            header = headers?.[index];
            if (header == null)
                throw new Error('Invalid path');

            headerTrail.push({ index, header, siblings: headers! });
            headers = header.children;
        }

        // Step 2: Go down to find leaf headers
        if (header == null) throw new Error('Empty path');
        let removedColumnIndices = this.#getLeafColumnIndices(header);

        // Step 3: Go up deleting empty parents
        const lastDeletedPath = [...headerPath];
        while (headerTrail.length) {
            const headerInfo = headerTrail.pop()!;
            removedColumnIndices = [{
                index: this._state.columns.getIndex(headerInfo.header.column),
                children: removedColumnIndices
            }];

            headerInfo.siblings.splice(headerInfo.index, 1);
            if (headerInfo.siblings.length) break;

            lastDeletedPath.pop();
        }

        toUndo(this.addMany.action(removedColumnIndices![0], lastDeletedPath));

        this._state.scheduler._add(this.#rebuildHeaderRowsJob);
    });
}