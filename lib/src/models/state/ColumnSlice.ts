import { TableData } from '../../utils/configUtils';
import StateSlice from '../StateSlice';
import { Column } from '../../utils/columnUtils';
import { TreePath } from '../../utils/unrootedTreeUtils';
import Observable from '../Observable';

export type SortOrder = 'ascending' | 'descending';
export type NewSortOrder = SortOrder | null | 'toggle' | 'cycle';

export interface SortByColumnArgs<TData extends TableData> {
    column: Column<TData['row']>,
    newOrder: NewSortOrder,
    append: boolean
}

export default class ColumnSlice<TData extends TableData> extends StateSlice<Column<TData['row']>[]> {
    sortByColumn = new Observable<[SortByColumnArgs<TData>]>();

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

    sortBy(path: TreePath, newOrder: NewSortOrder, append: boolean) {
        this.sortByColumn.notify({ column: this.#getAtPath(path), newOrder, append });
    }
}