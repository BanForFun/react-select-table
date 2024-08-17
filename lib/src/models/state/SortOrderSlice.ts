import { TableData } from '../../utils/configUtils';
import SchedulerSlice from './SchedulerSlice';
import { PickRequired } from '../../utils/types';
import { Column, isColumnGroup, LeafColumn } from '../../utils/columnUtils';
import { indexOf } from '../../utils/iterableUtils';
import Observable from '../Observable';
import ColumnSlice, { NewSortOrder, SortOrder } from './ColumnSlice';
import UndoableStateSlice from '../UndoableStateSlice';
import HistorySlice from './HistorySlice';
import { TreePath } from '../../utils/unrootedTreeUtils';

interface Dependencies<TData extends TableData> {
    history: HistorySlice;
    scheduler: SchedulerSlice;
    columns: ColumnSlice<TData>;
}

export interface SortColumn {
    order: SortOrder;
    index: number;
}

type SortableColumn<TContext> = PickRequired<LeafColumn<TContext>, 'compareContext'>

export function isSortableColumn<TContext>(column: Column<TContext>): column is SortableColumn<TContext> {
    return !isColumnGroup(column) && column.compareContext !== undefined;
}

export default class SortOrderSlice<TData extends TableData> extends UndoableStateSlice<Dependencies<TData>> {
    readonly #sortOrders = new Map<SortableColumn<TData['row']>, SortOrder>();

    protected _sliceKey: string = 'sortOrder';

    readonly changed = new Observable();

    #notifyChangedJob = () => {
        this.changed.notify();
    };

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

    compareRowData(a: TData['row'], b: TData['row']) {
        let lastOrder: SortOrder = 'ascending';
        for (const [column, order] of this.#sortOrders) {
            const result = column.compareContext(a, b);
            if (result !== 0)
                return { order, result };

            lastOrder = order;
        }

        return { order: lastOrder, result: 0 };
    }

    sortBy = this._dispatcher('sortBy', toUndo => (path: TreePath, newOrder: NewSortOrder, append: boolean) => {
        const column = this._state.columns.getAtPath(path);

        if (!isSortableColumn(column))
            throw new Error('Cannot sort by this column');

        const oldOrder = this.#sortOrders.get(column) ?? null;
        const resolvedOrder = this.#resolveOrder(newOrder, oldOrder);

        if (append || this.#sortOrders.size == 0) {
            toUndo(this.sortBy.action(path, oldOrder, true));
        } else {
            let append = false;
            for (const [column, order] of this.#sortOrders.entries()) {
                toUndo(this.sortBy.action(this._state.columns.getPath(column), order, append));
                append ||= true;
            }

            this.#sortOrders.clear();
        }

        if (resolvedOrder == null)
            this.#sortOrders.delete(column);
        else
            this.#sortOrders.set(column, resolvedOrder);

        this._state.scheduler._add(this.#notifyChangedJob);
    });
}