import { TableData } from '../../utils/configUtils';
import Observable from '../Observable';
import SortOrderSlice from './SortOrderSlice';
import SchedulerSlice from './SchedulerSlice';
import { OptionalIfPartial } from '../../utils/typeUtils';
import UndoableStateSlice from '../UndoableStateSlice';
import HistorySlice from './HistorySlice';
import FilterSlice from './FilterSlice';
import { comparePrimitives } from '../../utils/sortUtils';
import DLList from '../DLList';
import { createIterableIterator, createIterator, find } from '../../utils/iterableUtils';
import SLList from '../SLList';

type RowKey = number | string;

interface RowConfig<TData extends TableData> {
    getRowKey: (row: TData['row']) => RowKey;
}

interface Dependencies<TData extends TableData> {
    scheduler: SchedulerSlice;
    filter: FilterSlice<TData>;
    sortOrder: SortOrderSlice<TData>;
    history: HistorySlice;
}

export default class RowSlice<TData extends TableData> extends UndoableStateSlice<TData, Dependencies<TData>, RowConfig<TData>> {
    #rows = new SLList<TData['row']>();

    protected _sliceKey: string = 'rows';

    readonly changed = new Observable();

    #compareRowKeys(a: TData['row'], b: TData['row']) {
        return comparePrimitives(this.config.getRowKey(a), this.config.getRowKey(b));
    }

    #compareRows = (a: TData['row'], b: TData['row']) => {
        return this._state.sortOrder.compareRowData(a, b) || this.#compareRowKeys(a, b);
    };

    #keySet = (items: TData['row'][]) => {
        const keys = new Set<RowKey>();
        for (const item of items)
            keys.add(this.config.getRowKey(item));

        return keys;
    };

    constructor(config: OptionalIfPartial<RowConfig<TData>>, state: Dependencies<TData>) {
        super(config, state);
    }

    #mergeSorted = this._dispatcher('merge', (toUndo, items: TData['row'][]) => {
        this.#rows.mergeSorted(items, this.#compareRows);

        this.changed.notify();

        toUndo(this.removeKeys.action(this.#keySet(items)));
    });

    #truncate = this._dispatcher('truncate', (toUndo, afterKey: RowKey) => {
        const afterNode = find(this.#rows, n => this.config.getRowKey(n) === afterKey);
        if (!afterNode) return;

        const removed = this.#rows.removeAfter(afterNode, Infinity);

        this.changed.notify();

        toUndo(this.appendSorted.action(removed));
    });

    add = (items: TData['row'][]) => {
        const sortedItems = items
            .filter(this._state.filter.isVisible)
            .sort(this.#compareRows);

        this.#mergeSorted(sortedItems);
    };

    clear = this._dispatcher('clear', (toUndo) => {
        const old = Array.from(this.#rows);
        this.#rows.clear();

        this.changed.notify();

        toUndo(this.appendSorted.action(old));
    });

    removeKeys = this._dispatcher('removeKeys', (toUndo, keys: Set<RowKey>) => {
        const removed = this.#rows.removeBy((row) => {
            const key = this.config.getRowKey(row);
            const shouldUnlink = keys.delete(key);
            return { value: shouldUnlink, done: !keys.size };
        });

        this.changed.notify();

        toUndo(this.#mergeSorted.action(removed));
    });

    appendSorted = this._dispatcher('appendSorted', (toUndo, rows: TData['row'][]) => {
        if (rows.length === 0) return;

        const oldTail = this.#rows.tail;
        this.#rows.push(...rows);

        this.changed.notify();

        toUndo(oldTail
            ? this.#truncate.action(this.config.getRowKey(oldTail))
            : this.clear.action());
    });

    replace = this._dispatcher('update', (toUndo, key: RowKey, row: TData['row']) => {

    });

    iterator() {
        return createIterableIterator(this.#rows);
    }
}