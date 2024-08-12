import { Config, TableData } from '../../utils/configUtils';
import JobScheduler from '../JobScheduler';
import { PickRequired } from '../../utils/types';
import { Column, isColumnGroup, LeafColumn } from '../../utils/columnUtils';
import { NewSortOrder, SortOrder } from './HeaderState';
import { indexOf } from '../../utils/iterableUtils';
import { Event } from '../Observable';
import Dependent from '../Dependent';

export interface SortColumn {
    order: SortOrder;
    index: number;
}

type SortableColumn<TContext> = PickRequired<LeafColumn<TContext>, 'compareContext'>

export function isSortableColumn<TContext>(column: Column<TContext>): column is SortableColumn<TContext> {
    return !isColumnGroup(column) && column.compareContext !== undefined;
}

export default class SortOrderState<TData extends TableData> extends Dependent {
    readonly #sortOrders = new Map<SortableColumn<TData['row']>, SortOrder>();

    readonly changed = new Event();

    constructor(private _config: Config<TData>, private _scheduler: JobScheduler) {
        super({});
    }

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

    sortBy(column: Column<TData['row']>, newOrder: NewSortOrder, append: boolean) {
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

        this._scheduler.add(this.#notifyChangedJob);

        return oldOrder;
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