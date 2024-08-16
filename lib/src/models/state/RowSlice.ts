import { comparePrimitives } from '../../utils/sortUtils';
import { TableData } from '../../utils/configUtils';
import Observable from '../Observable';
import DLList, { RestrictedDLList, Sorted } from '../DLList';
import SortOrderSlice from './SortOrderSlice';
import StateSlice from '../StateSlice';
import SchedulerSlice from './SchedulerSlice';
import { OptionalIfPartial } from '../../utils/types';

interface RowConfig<TData extends TableData> {
    getRowKey: (row: TData['row']) => string;
}

interface Dependencies<TData extends TableData> {
    scheduler: SchedulerSlice;
    sortOrder: SortOrderSlice<TData>;
}

export type Row<TData extends TableData> = TData['row']; //Maybe cache key in the future

export default class RowSlice<TData extends TableData> extends StateSlice<Dependencies<TData>, RowConfig<TData>> {
    #rows = new DLList<Row<TData>>() as RestrictedDLList<Row<TData>, Sorted>;

    readonly changed = new Observable();
    readonly added = new Observable();

    #createRow = (data: TData['row']): Row<TData> => data; // Maybe cache key in the future

    #compareRows = (a: Row<TData>, b: Row<TData>) => {
        //Sort the row key using the least significant sort order
        const comparison = this._state.sortOrder.compareRowData(a, b);
        comparison.result ??= comparePrimitives(this.getRowKey(a), this.getRowKey(b));

        if (comparison.order === 'ascending')
            return comparison.result;

        return comparison.result * -1;
    };

    #sortAll = () => {
        this.#rows.sort(this.#compareRows);
        this._state.scheduler._add(this.changed.notify);
    };

    constructor(config: OptionalIfPartial<RowConfig<TData>>, state: Dependencies<TData>) {
        super(config, state);
        state.sortOrder.changed.addObserver(this.#sortAll);
    }

    getRowKey = (row: Row<TData>) => {
        // Maybe load from cache in the future
        return this.config.getRowKey(row);
    };

    iterator() {
        return this.#rows.head.forwardIterator();
    }

    add(rowData: TData['row'][]) {
        const newRows: Row<TData>[] = rowData.map(this.#createRow);

        this.#rows.add(newRows, this.#compareRows);
        this._state.scheduler._add(this.added.notify);
    }
}