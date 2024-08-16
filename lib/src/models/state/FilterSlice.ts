import { TableData } from '../../utils/configUtils';
import { Row } from './RowSlice';
import StateSlice from '../StateSlice';

interface FilterConfig<TData extends TableData> {
    shouldRowBeVisible?: (row: TData['row'], filter: TData['filter']) => boolean;
}

export default class FilterSlice<TData extends TableData> extends StateSlice<object, FilterConfig<TData>> {
    #filter: TData['filter'] | null = null;

    isVisible = (row: Row<TData>) => {
        // Maybe load from cache in the future
        return this.#shouldRowBeVisible(row);
    };

    #shouldRowBeVisible(rowData: TData['row']) {
        if (!this.config?.shouldRowBeVisible) return true;
        if (this.#filter == null) return true;
        return this.config.shouldRowBeVisible(rowData, this.#filter);
    };
}