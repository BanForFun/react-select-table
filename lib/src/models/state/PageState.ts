import { Config, TableData } from '../../utils/configUtils';
import JobBatch from '../JobBatch';

export default class PageState<TData extends TableData> {
    #size: number = Infinity;

    constructor(
        private _config: Config<TData>,
        private _jobBatch: JobBatch
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