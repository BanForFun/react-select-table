import { comparePrimitives } from '../../utils/sortUtils';
import { Config, TableData } from '../../utils/configUtils';
import ColumnState from './ColumnState';
import Command from '../Command';
import JobBatch from '../JobBatch';
import DoublyLinkedList, { DoublyLinkedNode, DoublyLinkedNodeWrapper } from '../DoublyLinkedList';

type Row<TData extends TableData> = TData['row']; //Maybe cache key in the future

export default class RowState<TData extends TableData> {
    #rows = new DoublyLinkedList<Row<TData>>();
    #currentPageHead = new DoublyLinkedNodeWrapper<Row<TData>>();
    #nextPageHead = new DoublyLinkedNodeWrapper<Row<TData>>();
    #pageSize: number = 0;
    #pageIndex: number = 0;
    #visibleRowCount: number = 0;
    #filter: TData['filter'] | null = null;

    refreshPage = new Command();

    constructor(
        private _config: Config<TData>,
        private _jobBatch: JobBatch,
        private _columnState: ColumnState<TData>
    ) {
        this._columnState.refreshRows.addObserver(this.#sortAll);
    }

    #createRow = (data: TData['row']): Row<TData> => data; // Maybe cache key and visibility

    #getRowKey = (row: Row<TData>) => {
        // Maybe cache
        return this._config.getRowKey(row);
    };

    #isRowVisible = (row: Row<TData>) => {
        // Maybe cache
        return this.#shouldRowBeVisible(row);
    };

    #compareRows = (a: Row<TData>, b: Row<TData>) => {
        const result = this._columnState.compareRowData(a, b);
        if (result !== 0) return result;

        const keyResult = comparePrimitives(this.#getRowKey(a), this.#getRowKey(b));
        if (keyResult === 0) throw new Error('Encountered multiple rows with the same key');

        return keyResult;
    };

    #shouldRowBeVisible = (rowData: TData['row']) => {
        if (this.#filter == null) return true;

        const { shouldRowBeVisible } = this._config;
        if (shouldRowBeVisible == null) return true;

        return shouldRowBeVisible(rowData, this.#filter);
    };

    #sortAll = () => {

    };

    * currentPageIterator() {
        let i = 0;
        for (const row of this.#currentPageHead.forwardIterator()) {
            if (this.#pageSize > 0 && i++ >= this.#pageSize) break;
            yield row;
        }
    }

    add(rowData: TData['row'][]) {
        const existingRows = this.#rows.head.forwardIterator();
        const newRows: Row<TData>[] = rowData.map(this.#createRow).sort(this.#compareRows);

        this.#visibleRowCount = 0;
        this.#currentPageHead.clear();
        this.#nextPageHead.clear();

        const pageStartIndex = this.#pageIndex * this.#pageSize;
        const nextPageStartIndex = (this.#pageIndex + 1) * this.#pageSize;

        let rowIndex = 0;
        let existingRow = existingRows.next();

        while (!existingRow.done || rowIndex < newRows.length) {
            let row: DoublyLinkedNode<Row<TData>>;

            if (existingRow.done) {
                row = this.#rows.append(newRows[rowIndex]);
                rowIndex++;
            } else if (rowIndex < newRows.length && this.#compareRows(newRows[rowIndex], existingRow.value) < 0) {
                row = this.#rows.prepend(newRows[rowIndex], existingRow.value);
                rowIndex++;
            } else {
                row = existingRow.value;
                existingRow = existingRows.next();
            }

            if (!this.#isRowVisible(row)) continue;

            if (this.#visibleRowCount === pageStartIndex)
                this.#currentPageHead.set(row);
            else if (this.#visibleRowCount === nextPageStartIndex)
                this.#nextPageHead.set(row);

            this.#visibleRowCount++;
        }

        this._jobBatch.add(this.refreshPage.notify.bind(this.refreshPage));
    }
}