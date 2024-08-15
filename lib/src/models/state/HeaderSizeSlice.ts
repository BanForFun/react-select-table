import { TableData } from '../../utils/configUtils';
import HeaderSlice, { ReadonlyHeader } from './HeaderSlice';
import StateSlice from '../StateSlice';

interface HeaderSizeConfig {
    defaultColumnWidthPercentage: number;
}

interface Dependencies<TData extends TableData> {
    headers: HeaderSlice<TData>;
}

export default class HeaderSizeSlice<TData extends TableData> extends StateSlice<HeaderSizeConfig, Dependencies<TData>> {
    #sizes = new WeakMap<ReadonlyHeader<TData>, number>();

    protected _init() {
        this._state.headers.added.addObserver((added) => {
            for (const header of added) {
                this.#sizes.set(header, this.config.defaultColumnWidthPercentage);
            }
        });
    };

    get(header: ReadonlyHeader<TData>) {
        return this.#sizes.get(header);
    }
}