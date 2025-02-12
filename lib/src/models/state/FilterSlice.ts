import { TableData } from '../../utils/configUtils';
import StateSlice from '../StateSlice';

interface FilterConfig<TData extends TableData> {
    shouldRowBeVisible?: (row: TData['row'], filter: TData['filter']) => boolean;
}

export default class FilterSlice<TData extends TableData> extends StateSlice<TData, object, FilterConfig<TData>> {
    #filter: TData['filter'] | null = null;

    isVisible = (row: TData['row']) => {
        if (!this.config?.shouldRowBeVisible) return true;
        if (this.#filter == null) return true;
        return this.config.shouldRowBeVisible(row, this.#filter);
    };
}