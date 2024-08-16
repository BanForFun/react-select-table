import { TableData } from '../../utils/configUtils';
import { Column } from '../../utils/columnUtils';
import { TreePath } from '../../utils/unrootedTreeUtils';
import Observable from '../Observable';
import UndoableStateSlice from '../UndoableStateSlice';

export type SortOrder = 'ascending' | 'descending';
export type NewSortOrder = SortOrder | null | 'toggle' | 'cycle';

export interface SortByColumnArgs<TData extends TableData> {
    toUndo: (oldOrder: SortOrder | null) => void;
    column: Column<TData['row']>;
    newOrder: NewSortOrder;
    append: boolean;
}

export default class ColumnSlice<TData extends TableData> extends UndoableStateSlice<object, Column<TData['row']>[]> {
    protected _sliceKey: string = 'columns';
    _sortByColumn = new Observable<SortByColumnArgs<TData>>();

    #getAtPath(path: TreePath): Column<TData['row']> {
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

    sortBy = this._dispatcher('sortBy', toUndo => (path: TreePath, newOrder: NewSortOrder, append: boolean) => {
        this._sortByColumn.notify({
            column: this.#getAtPath(path),
            newOrder,
            append,
            toUndo: (oldOrder) => toUndo(this.sortBy.action(path, oldOrder, append))
        });
    });
}