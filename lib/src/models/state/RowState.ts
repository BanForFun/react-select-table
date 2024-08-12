import { comparePrimitives } from '../../utils/sortUtils';
import { Config, TableData } from '../../utils/configUtils';
import { Event } from '../Observable';
import JobScheduler from '../JobScheduler';
import DoublyLinkedList from '../DoublyLinkedList';
import SortOrderState from './SortOrderState';
import Dependent from '../Dependent';

interface Dependencies<TData extends TableData> {
    sortOrder: SortOrderState<TData>;
}

export type Row<TData extends TableData> = TData['row']; //Maybe cache key in the future

export default class RowState<TData extends TableData> extends Dependent<Dependencies<TData>> {
    #rows = new DoublyLinkedList<Row<TData>>();

    readonly changed = new Event();
    readonly added = new Event();

    constructor(
        private _config: Config<TData>,
        private _scheduler: JobScheduler,
        private _state: Dependencies<TData>
    ) {
        super(_state);
        this._state.sortOrder.changed.addObserver(this.#sortAll);
    }

    #createRow = (data: TData['row']): Row<TData> => data; // Maybe cache key in the future

    #compareRows = (a: Row<TData>, b: Row<TData>) => {
        const result = this._state.sortOrder.compareRowData(a, b);
        if (result !== 0) return result;

        return comparePrimitives(this.getRowKey(a), this.getRowKey(b));
    };

    #sortAll = () => {
        //TODO: Implement

        //this._scheduler.add(this.changed.notify);
    };

    getRowKey = (row: Row<TData>) => {
        // Maybe load from cache in the future
        return this._config.getRowKey(row);
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

        this._scheduler.add(this.added.notify);
    }
}