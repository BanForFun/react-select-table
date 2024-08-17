import { TableData } from '../../utils/configUtils';
import PageSlice from './PageSlice';
import RowSlice, { Row } from './RowSlice';
import { DLNodeWrapper } from '../DLList';
import FilterSlice from './FilterSlice';
import Observable from '../Observable';
import StateSlice from '../StateSlice';
import SchedulerSlice from './SchedulerSlice';
import { OptionalIfPartial } from '../../utils/types';

interface Dependencies<TData extends TableData> {
    scheduler: SchedulerSlice;
    page: PageSlice;
    filter: FilterSlice<TData>;
    rows: RowSlice<TData>;
}

export default class VisibleRowSlice<TData extends TableData> extends StateSlice<Dependencies<TData>> {
    #currentPageHead = new DLNodeWrapper<Row<TData>>();
    #nextPageHead = new DLNodeWrapper<Row<TData>>();
    #pageIndex: number = 0;
    #rowCount: number = 0;

    readonly changed = new Observable();
    readonly added = new Observable();
    readonly removed = new Observable();

    #rebuildPage() {
        this.#rowCount = 0;
        this.#currentPageHead.clear();
        this.#nextPageHead.clear();

        let pageIndex = 0;

        for (const row of this._state.rows.iterator()) {
            if (!this._state.filter.isVisible(row)) continue;

            if (this.#rowCount === 0) {
                this.#currentPageHead.set(row);
            }

            if (pageIndex < this.#pageIndex && this.#rowCount % this._state.page.size === 0) {
                this.#currentPageHead.set(this.#nextPageHead.current);
                this.#nextPageHead.set(row);
                pageIndex++;
            }

            this.#rowCount++;
        }

        this.#pageIndex = pageIndex;
    };


    constructor(config: OptionalIfPartial<object>, state: Dependencies<TData>) {
        super(config, state);

        state.rows.added.addObserver(() => {
            this.#rebuildPage();
            state.scheduler._add(this.added.notify);
        });

        state.rows.removed.addObserver(() => {
            this.#rebuildPage();
            state.scheduler._add(this.removed.notify);
        });

        state.rows.changed.addObserver(() => {
            this.#pageIndex = 0;
            this.#rebuildPage();
            state.scheduler._add(this.changed.notify);
        });
    }

    * iterator() {
        let visibleIndex = 0;
        for (const row of this.#currentPageHead.forwardIterator()) {
            if (visibleIndex >= this._state.page.size) break;
            if (!this._state.filter.isVisible(row)) continue;

            visibleIndex++;
            yield row;
        }
    }
}