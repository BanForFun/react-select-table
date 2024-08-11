import { Config, TableData } from '../../utils/configUtils';
import JobBatch from '../JobBatch';

export default class PageState<TData extends TableData> {
    #size: number = 0;

    constructor(
        private _config: Config<TData>,
        private _jobBatch: JobBatch
    ) {

    }

    get size() {
        return this.#size;
    }
}