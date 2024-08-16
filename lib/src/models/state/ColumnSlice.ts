import { TableData } from '../../utils/configUtils';
import { Column, isColumnGroup } from '../../utils/columnUtils';
import { TreePath } from '../../utils/unrootedTreeUtils';
import Observable from '../Observable';
import UndoableStateSlice from '../UndoableStateSlice';
import HistorySlice from './HistorySlice';

export type SortOrder = 'ascending' | 'descending';
export type NewSortOrder = SortOrder | null | 'toggle' | 'cycle';

export interface SortByColumnArgs {
    toUndo: (path: TreePath, order: SortOrder | null, append: boolean) => void;
    path: TreePath;
    newOrder: NewSortOrder;
    append: boolean;
}

export default class ColumnSlice<TData extends TableData> extends UndoableStateSlice<object, Column<TData['row']>[]> {
    #paths = new Map<Column<TData['row']>, TreePath>();

    protected _sliceKey: string = 'columns';

    _sortByColumn = new Observable<SortByColumnArgs>();

    getAtPath(path: TreePath): Column<TData['row']> {
        let columns = this.config;
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

    #buildPaths(columns: Column<TData['row']>[], basePath: TreePath) {
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            const path = Object.freeze([...basePath, i]);
            this.#paths.set(column, path);

            if (isColumnGroup(column))
                this.#buildPaths(column.children, path);
        }
    }

    constructor(config: Column<TData['row']>[], state: { history: HistorySlice }) {
        super(config, state);
        this.#buildPaths(config, []);
    }

    getPath(column: Column<TData['row']>) {
        const path = this.#paths.get(column);
        if (!path) throw new Error('Unknown column');

        return path;
    }

    getIndex(column: Column<TData['row']>) {
        return this.getPath(column).at(-1)!;
    }

    sortBy = this._dispatcher('sortBy', toUndo => (path: TreePath, newOrder: NewSortOrder, append: boolean) => {
        this._sortByColumn.notify({
            path,
            newOrder,
            append,
            toUndo: (path, order, append) => toUndo(this.sortBy.action(path, order, append))
        });
    });
}