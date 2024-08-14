import { TableData } from '../../utils/configUtils';
import { Row } from './RowSlice';
import { PartialConfigStateSlice } from '../StateSlice';

interface FilterConfig<TData extends TableData> {
    shouldRowBeVisible: (row: TData['row'], filter: TData['filter']) => boolean;
}

export default class FilterSlice<TData extends TableData> extends PartialConfigStateSlice<FilterConfig<TData>> {
    protected _getDefaultConfig(): FilterConfig<TData> {
        return {
            shouldRowBeVisible: () => true
        };
    }

    #filter: TData['filter'] | null = null;

    isVisible = (row: Row<TData>) => {
        // Maybe load from cache in the future
        return this.#shouldRowBeVisible(row);
    };

    #shouldRowBeVisible(rowData: TData['row']) {
        if (this.#filter == null) return true;
        return this._config.shouldRowBeVisible(rowData, this.#filter);
    };
}