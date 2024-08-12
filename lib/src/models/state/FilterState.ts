import { Config, TableData } from '../../utils/configUtils';
import JobScheduler from '../JobScheduler';
import { Row } from './RowState';
import Dependent from '../Dependent';

export default class FilterState<TData extends TableData> extends Dependent {
    #filter: TData['filter'] | null = null;

    constructor(
        private _config: Config<TData>,
        private _scheduler: JobScheduler
    ) {
        super({});
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