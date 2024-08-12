import { Config, TableData } from '../../utils/configUtils';
import JobScheduler from '../JobScheduler';

export default class PageState<TData extends TableData> {
    #size: number = Infinity;

    constructor(
        private _config: Config<TData>,
        private _scheduler: JobScheduler
    ) {

    }

    getPageStartIndex(pageIndex: number) {
        if (pageIndex === 0) return 0;
        if (!isFinite(this.#size)) return Infinity;

        return this.#size * pageIndex;
    };

    get size() {
        return this.#size;
    }
}