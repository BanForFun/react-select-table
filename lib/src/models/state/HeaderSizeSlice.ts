import { TableData } from '../../utils/configUtils';
import HeaderSlice, { ReadonlyHeader } from './HeaderSlice';
import StateSlice from '../StateSlice';

interface HeaderSizeConfig {
    defaultColumnWidthPercentage: number;
}

interface Dependencies<TData extends TableData> {
    headers: HeaderSlice<TData>;
}

export default class HeaderSizeSlice<TData extends TableData> extends StateSlice<Dependencies<TData>, HeaderSizeConfig> {
    #sizes = new WeakMap<ReadonlyHeader<TData>, number>();


    constructor(config: HeaderSizeConfig, state: Dependencies<TData>) {
        super(config, state);

        this._state.headers.added.addObserver((added) => {
            for (const header of added) {
                this.#sizes.set(header, this.config.defaultColumnWidthPercentage);
            }
        });
    }

    get(header: ReadonlyHeader<TData>) {
        return this.#sizes.get(header);
    }
}