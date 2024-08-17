import { TableData } from '../../utils/configUtils';
import Observable from '../Observable';
import DLList, { RestrictedDLList, Sorted } from '../DLList';
import SortOrderSlice from './SortOrderSlice';
import SchedulerSlice from './SchedulerSlice';
import { OptionalIfPartial } from '../../utils/types';
import UndoableStateSlice from '../UndoableStateSlice';
import HistorySlice from './HistorySlice';

export type RowKey = string;

interface RowConfig<TData extends TableData> {
    getRowKey: (row: TData['row']) => RowKey;
}

interface Dependencies<TData extends TableData> {
    scheduler: SchedulerSlice;
    sortOrder: SortOrderSlice<TData>;
    history: HistorySlice;
}

export type Row<TData extends TableData> = TData['row']; //Maybe cache key in the future

export default class RowSlice<TData extends TableData> extends UndoableStateSlice<Dependencies<TData>, RowConfig<TData>> {
    #rows = new DLList<Row<TData>>() as RestrictedDLList<Row<TData>, Sorted>;

    protected _sliceKey: string = 'rows';

    readonly changed = new Observable();
    readonly added = new Observable();
    readonly removed = new Observable();

    #createRow = (data: TData['row']): Row<TData> => data; // Maybe cache key in the future

    #compareRows = (a: Row<TData>, b: Row<TData>) => {
        const comparison = this._state.sortOrder.compareRowData(a, b);
        // comparison.result ||= comparePrimitives(this.getRowKey(a), this.getRowKey(b));

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

    add = this._dispatcher('add', toUndo => (rows: TData['row'][]) => {
        const newRows: Row<TData>[] = rows.map(this.#createRow);

        this.#rows.add(newRows, this.#compareRows);
        this._state.scheduler._add(this.added.notify);

        const keys = new Set<RowKey>();
        for (const row of newRows)
            keys.add(this.getRowKey(row));

        toUndo(this.remove.action(keys));
    });

    remove = this._dispatcher('remove', toUndo => (rowKeys: Set<RowKey>) => {
        const removed = this.#rows.remove(row => rowKeys.has(this.getRowKey(row)));
        this._state.scheduler._add(this.removed.notify);

        toUndo(this.add.action(removed));
    });
}