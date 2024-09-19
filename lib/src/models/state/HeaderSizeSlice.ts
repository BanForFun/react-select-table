import { TableData } from '../../utils/configUtils';
import HeaderSlice, { ReadonlyLeafHeader } from './HeaderSlice';
import UndoableStateSlice from '../UndoableStateSlice';
import HistorySlice from './HistorySlice';
import Observable from '../Observable';
import SchedulerSlice from './SchedulerSlice';

interface HeaderSizeConfig {
    defaultColumnWidthPercentage: number;
}

interface Dependencies<TData extends TableData> {
    history: HistorySlice;
    scheduler: SchedulerSlice;
    headers: HeaderSlice<TData>;
}

export default class HeaderSizeSlice<TData extends TableData> extends UndoableStateSlice<Dependencies<TData>, HeaderSizeConfig> {
    #sizes = new WeakMap<ReadonlyLeafHeader<TData>, number>();

    protected readonly _sliceKey = 'headerSize';

    readonly changed = new Observable();

    constructor(config: HeaderSizeConfig, state: Dependencies<TData>) {
        super(config, state);

        this._state.headers._added.addObserver((added) => {
            for (const header of added) {
                this.#sizes.set(header, this.config.defaultColumnWidthPercentage);
            }
        });
    }

    get(header: ReadonlyLeafHeader<TData>) {
        return this.#sizes.get(header);
    }

    set = this._dispatcher('set', (toUndo, start: number, widths: number[]) => {
        const original: number[] = [];

        let headerIndex = 0;
        let widthIndex = 0;
        for (const header of this._state.headers.leafIterator()) {
            if (headerIndex++ < start) continue;

            if (widthIndex >= widths.length) break;
            original[widthIndex] = this.#sizes.get(header)!;
            this.#sizes.set(header, widths[widthIndex++]);
        }

        toUndo(this.set.action(start, original));

        this._state.scheduler._add(this.changed.notify);
    });
}