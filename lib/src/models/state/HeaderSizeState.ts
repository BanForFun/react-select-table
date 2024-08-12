import { Config, TableData } from '../../utils/configUtils';
import JobScheduler from '../JobScheduler';
import HeaderState, { HeaderId, LeafHeaderUpdate } from './HeaderState';
import Dependent from '../Dependent';

interface Dependencies<TData extends TableData> {
    headers: HeaderState<TData>;
}

export default class HeaderSizeState<TData extends TableData> extends Dependent<Dependencies<TData>> {
    #sizes: Record<HeaderId, number> = {};

    constructor(
        private _config: Config<TData>,
        private _scheduler: JobScheduler,
        private _state: Dependencies<TData>
    ) {
        super(_state);
        this._state.headers.leafChanged.addObserver(this.#handleLeafChanged);
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