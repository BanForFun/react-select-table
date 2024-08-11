import { Config, TableData } from '../../utils/configUtils';
import JobBatch from '../JobBatch';
import HeaderState, { HeaderId, LeafHeaderUpdate } from './HeaderState';

export default class HeaderSizeState<TData extends TableData> {
    #sizes: Record<HeaderId, number> = {};

    constructor(
        private _config: Config<TData>,
        private _jobBatch: JobBatch,
        private _headerState: HeaderState<TData>
    ) {
        _headerState.leafChanged.addObserver(this.#handleLeafChanged);
    }

    #handleLeafChanged = (update: LeafHeaderUpdate<TData>) => {
        if (update.type === 'add') {
            for (const header of update.headers) {
                this.#sizes[header.id] = this._config.defaultColumnWidthPercentage;
            }
        } else if (update.type === 'remove') {
            for (const header of update.headers) {
                delete this.#sizes[header.id];
            }
        }
    };

    get(id: HeaderId) {
        return this.#sizes[id];
    }
}