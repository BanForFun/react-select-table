import { TableData } from '../../utils/configUtils';
import SchedulerSlice from './SchedulerSlice';
import { OptionalIfPartial, PickRequired } from '../../utils/types';
import { Column, isColumnGroup, LeafColumn } from '../../utils/columnUtils';
import { indexOf } from '../../utils/iterableUtils';
import Observable from '../Observable';
import StateSlice from '../StateSlice';
import ColumnSlice, { NewSortOrder, SortByColumnArgs, SortOrder } from './ColumnSlice';

interface Dependencies<TData extends TableData> {
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

export default class SortOrderSlice<TData extends TableData> extends StateSlice<Dependencies<TData>> {
    readonly #sortOrders = new Map<SortableColumn<TData['row']>, SortOrder>();

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

    #sortBy = ({ path, newOrder, append, toUndo }: SortByColumnArgs) => {
        const column = this._state.columns.getAtPath(path);

        if (!isSortableColumn(column))
            throw new Error('Cannot sort by this column');

        const oldOrder = this.#sortOrders.get(column) ?? null;
        const resolvedOrder = this.#resolveOrder(newOrder, oldOrder);

        if (append || this.#sortOrders.size == 0) {
            toUndo(path, oldOrder, true);
        } else {
            let append = false;
            for (const [column, order] of this.#sortOrders.entries()) {
                toUndo(this._state.columns.getPath(column), order, append);
                append ||= true;
            }

            this.#sortOrders.clear();
        }

        if (resolvedOrder == null)
            this.#sortOrders.delete(column);
        else
            this.#sortOrders.set(column, resolvedOrder);

        this._state.scheduler._add(this.#notifyChangedJob);
    };


    constructor(config: OptionalIfPartial<object>, state: Dependencies<TData>) {
        super(config, state);
        state.columns._sortByColumn.addObserver(this.#sortBy);
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

        return { order: lastOrder, result: null };
    }
}