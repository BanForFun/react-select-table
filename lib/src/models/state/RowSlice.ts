import { comparePrimitives } from '../../utils/sortUtils';
import { TableData } from '../../utils/configUtils';
import { Event } from '../Observable';
import DoublyLinkedList from '../DoublyLinkedList';
import SortOrderSlice from './SortOrderSlice';
import StateSlice from '../StateSlice';
import SchedulerSlice from './SchedulerSlice';

interface RowConfig<TData extends TableData> {
    getRowKey: (row: TData['row']) => string;
}

interface Dependencies<TData extends TableData> {
    scheduler: SchedulerSlice;
    sortOrder: SortOrderSlice<TData>;
}

export type Row<TData extends TableData> = TData['row']; //Maybe cache key in the future

export default class RowSlice<TData extends TableData> extends StateSlice<RowConfig<TData>, Dependencies<TData>> {
    #rows = new DoublyLinkedList<Row<TData>>();

    readonly changed = new Event();
    readonly added = new Event();

    protected _init() {
        this._state.sortOrder.changed.addObserver(() => this.#sortAll());
    }

    #createRow = (data: TData['row']): Row<TData> => data; // Maybe cache key in the future

    #compareRows = (a: Row<TData>, b: Row<TData>) => {
        const result = this._state.sortOrder.compareRowData(a, b);
        if (result !== 0) return result;

        return comparePrimitives(this.getRowKey(a), this.getRowKey(b));
    };

    #sortAll() {
        //TODO: Implement

        //this._scheduler.add(this.changed.notify);
    };

    getRowKey = (row: Row<TData>) => {
        // Maybe load from cache in the future
        return this.config.getRowKey(row);
    };

    iterator() {
        return this.#rows.head.forwardIterator();
    }

    add(rowData: TData['row'][]) {
        const existingRows = this.#rows.head.forwardIterator();
        const newRows: Row<TData>[] = rowData.map(this.#createRow).sort(this.#compareRows);

        let rowIndex = 0;
        let existingRow = existingRows.next();

        while (!existingRow.done || rowIndex < newRows.length) {
            if (existingRow.done)
                this.#rows.append(newRows[rowIndex++]);
            else if (rowIndex < newRows.length && this.#compareRows(newRows[rowIndex], existingRow.value) < 0)
                this.#rows.prepend(newRows[rowIndex++], existingRow.value);
            else
                existingRow = existingRows.next();
        }

        this._state.scheduler._add(this.added.notify);
    }
}