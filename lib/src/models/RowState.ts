import { comparePrimitives } from '../utils/sortUtils';
import { Config, TableData } from '../utils/configUtils';
import ColumnState from './ColumnState';
import Command from './Command';
import JobBatch from './JobBatch';
import DoublyLinkedList, { DoublyLinkedNode, DoublyLinkedNodeWrapper } from './DoublyLinkedList';

interface Row<TData extends TableData> extends DoublyLinkedNode<Row<TData>> {
    data: TData['row'];
    isVisible: boolean;
    isSelected: boolean;
}

export default class RowState<TData extends TableData> {
    #rows = new DoublyLinkedList<Row<TData>>();
    #currentPageHead = new DoublyLinkedNodeWrapper<Row<TData>>();
    #nextPageHead = new DoublyLinkedNodeWrapper<Row<TData>>();
    #pageSize: number = 10; //TODO: Handle 0 value
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

    #getRowKey = (row: Row<TData>) => {
        return this._config.getRowKey(row.data);
    };

    #compareRows = (a: Row<TData>, b: Row<TData>) => {
        const result = this._columnState.compareRowData(a.data, b.data);
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

    #createRow = (data: TData['row']): Row<TData> => ({
        data,
        isSelected: false,
        isVisible: this.#shouldRowBeVisible(data),
        previous: null,
        next: null
    });

    #sortAll = () => {

    };

    * currentPageIterator() {
        let i = 0;
        for (const row of this.#currentPageHead.nextIterator()) {
            if (i++ >= this.#pageSize) break;
            yield row;
        }
    }

    add(rowData: TData['row'][]) {
        const existingRows = this.#rows.head.nextIterator();
        const newRows: Row<TData>[] = rowData.map(this.#createRow).sort(this.#compareRows);

        this.#visibleRowCount = 0;
        this.#currentPageHead.clear();
        this.#nextPageHead.clear();

        const pageStartIndex = this.#pageIndex * this.#pageSize;
        const nextPageStartIndex = (this.#pageIndex + 1) * this.#pageSize;

        let rowIndex = 0;
        let existingRow = existingRows.next();

        while (!existingRow.done || rowIndex < newRows.length) {
            let row: Row<TData>;

            if (existingRow.done) {
                row = newRows[rowIndex++];
                row.isSelected = true;
                this.#rows.append(row);
            } else if (rowIndex < newRows.length && this.#compareRows(newRows[rowIndex], existingRow.value) < 0) {
                row = newRows[rowIndex++];
                row.isSelected = true;
                this.#rows.link(existingRow.value.previous, row, existingRow.value);
            } else {
                row = existingRow.value;
                row.isSelected = false;
                existingRow = existingRows.next();
            }

            if (!row.isVisible) continue;

            if (this.#visibleRowCount === pageStartIndex)
                this.#currentPageHead.set(row);
            else if (this.#visibleRowCount === nextPageStartIndex)
                this.#nextPageHead.set(row);

            this.#visibleRowCount++;
        }

        this._jobBatch.add(this.refreshPage.notify.bind(this.refreshPage));
    }
}