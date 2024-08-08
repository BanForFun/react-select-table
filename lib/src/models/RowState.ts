import { comparePrimitives } from '../utils/sortUtils';
import { Config, TableData } from '../utils/configUtils';
import ColumnState from './ColumnState';

interface Row<TData extends TableData> {
    data: TData['row'];
    isSelected: boolean;
    isVisible: boolean;
    previous: Row<TData> | null;
    next: Row<TData> | null;
}

export default class RowState<TData extends TableData> {
    #head: Row<TData> | null = null;
    #tail: Row<TData> | null = null;
    #pageHead: Row<TData> | null = null;
    #pageTail: Row<TData> | null = null;
    #pageSize: number = 0;
    #pageIndex: number = 0;
    #filter: TData['filter'] | null = null;

    constructor(private _config: Config<TData>, private _columnState: ColumnState<TData>) {

    }

    #getRowKey = (row: Row<TData>) => {
        return this._config.getRowKey(row.data);
    };

    #compareRows = (a: Row<TData>, b: Row<TData>) => {
        const result = this._columnState.compareRowData(a.data, b.data);
        if (result !== 0) return result;

        return comparePrimitives(this.#getRowKey(a), this.#getRowKey(b));
    };

    #shouldRowBeVisible = (rowData: TData['row']) => {
        if (this.#filter == null) return true;

        const { shouldRowBeVisible } = this._config;
        if (shouldRowBeVisible == null) return true;

        return shouldRowBeVisible(rowData, this.#filter);
    };

    add(rowData: TData['row'][]) {
        // const rows: Row<TData>[] = rowData.map(data => ({
        //     data,
        //     isSelected: true,
        //     isVisible: this.#shouldRowBeVisible(data),
        //     previous: null,
        //     next: null
        // })).sort(this.#compareRows);

    }
}