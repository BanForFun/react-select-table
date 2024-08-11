import { Config, TableData } from '../../utils/configUtils';
import JobBatch from '../JobBatch';
import { Row } from './RowState';

export default class FilterState<TData extends TableData> {
    #filter: TData['filter'] | null = null;

    constructor(
        private _config: Config<TData>,
        private _jobBatch: JobBatch
    ) {

    }

    isVisible = (row: Row<TData>) => {
        // Maybe load from cache in the future
        return this.#shouldRowBeVisible(row);
    };

    #shouldRowBeVisible(rowData: TData['row']) {
        if (this.#filter == null) return true;

        const { shouldRowBeVisible } = this._config;
        if (shouldRowBeVisible == null) return true;

        return shouldRowBeVisible(rowData, this.#filter);
    };
}