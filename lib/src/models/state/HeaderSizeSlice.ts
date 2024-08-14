import { TableData } from '../../utils/configUtils';
import HeaderSlice, { HeaderId, LeafHeaderUpdate } from './HeaderSlice';
import StateSlice from '../StateSlice';

interface HeaderSizeConfig {
    defaultColumnWidthPercentage: number;
}

interface Dependencies<TData extends TableData> {
    headers: HeaderSlice<TData>;
}

export default class HeaderSizeSlice<TData extends TableData> extends StateSlice<HeaderSizeConfig, Dependencies<TData>> {
    #sizes: Record<HeaderId, number> = {};

    protected _init() {
        this._state.headers.leafChanged.addObserver((u) => this.#handleLeafChanged(u));
    };

    #handleLeafChanged(update: LeafHeaderUpdate<TData>) {
        if (update.type === 'add') {
            for (const header of update.headers) {
                this.#sizes[header.id] = this.config.defaultColumnWidthPercentage;
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