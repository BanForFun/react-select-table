import { Config, TableData } from '../../utils/configUtils';
import JobBatch from '../JobBatch';
import { PickRequired } from '../../utils/types';
import { Column, isColumnGroup, LeafColumn } from '../../utils/columnUtils';
import { NewSortOrder, SortOrder } from './HeaderState';
import { indexOf } from '../../utils/iterableUtils';
import { Event } from '../Observable';
import { TreePath } from '../../utils/unrootedTreeUtils';

export interface SortColumn {
    order: SortOrder;
    index: number;
}

type SortableColumn<TContext> = PickRequired<LeafColumn<TContext>, 'compareContext'>

export function isSortableColumn<TContext>(column: Column<TContext>): column is SortableColumn<TContext> {
    return !isColumnGroup(column) && column.compareContext !== undefined;
}

export default class SortOrderState<TData extends TableData> {
    readonly #sortOrders = new Map<SortableColumn<TData['row']>, SortOrder>();

    readonly changed = new Event();

    constructor(private _config: Config<TData>, private _jobBatch: JobBatch) {

    }

    #notifyChangedJob = () => {
        this.changed.notify();
    };

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

    #resolveOrder(newOrder: NewSortOrder, oldOrder: SortOrder | null): SortOrder | null {
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

    get(column: SortableColumn<TData['row']>): SortColumn | null {
        const order = this.#sortOrders.get(column);
        if (order == null) return null;

        return { index: indexOf(this.#sortOrders.keys(), column), order };
    }

    sortByColumn(column: Column<TData['row']>, newOrder: NewSortOrder, append: boolean) {
        if (!isSortableColumn(column))
            throw new Error('Cannot sort by this column');

        const oldOrder = this.#sortOrders.get(column) ?? null;
        const resolvedOrder = this.#resolveOrder(newOrder, oldOrder);

        if (!append)
            this.#sortOrders.clear();

        if (resolvedOrder == null)
            this.#sortOrders.delete(column);
        else
            this.#sortOrders.set(column, resolvedOrder);

        this._jobBatch.add(this.#notifyChangedJob);

        return oldOrder;
    }

    sortByPath(path: TreePath, newOrder: NewSortOrder, append: boolean) {
        return this.sortByColumn(this.#getColumnAtPath(path), newOrder, append);
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
}