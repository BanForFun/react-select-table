import { TableData } from '../../utils/configUtils';
import PageSlice from './PageSlice';
import RowSlice, { Row } from './RowSlice';
import { DLNodeWrapper } from '../DLList';
import FilterSlice from './FilterSlice';
import Observable from '../Observable';
import StateSlice from '../StateSlice';
import SchedulerSlice from './SchedulerSlice';

interface Dependencies<TData extends TableData> {
    scheduler: SchedulerSlice;
    page: PageSlice;
    filter: FilterSlice<TData>;
    rows: RowSlice<TData>;
}

export default class VisibleRowSlice<TData extends TableData> extends StateSlice<undefined, Dependencies<TData>> {
    #currentPageHead = new DLNodeWrapper<Row<TData>>();
    #nextPageHead = new DLNodeWrapper<Row<TData>>();
    #pageIndex: number = 0;
    #rowCount: number = 0;

    readonly changed = new Observable();
    readonly added = new Observable();

    protected _init() {
        this._state.rows.added.addObserver(() => {
            this.#rebuildPage();
            this._state.scheduler._add(this.added.notify);
        });

        this._state.rows.changed.addObserver(() => {
            this.#pageIndex = 0;
            this.#rebuildPage();
            this._state.scheduler._add(this.changed.notify);
        });
    }

    #rebuildPage() {
        this.#rowCount = 0;
        this.#currentPageHead.clear();
        this.#nextPageHead.clear();

        const pageStartIndex = this._state.page.getPageStartIndex(this.#pageIndex);
        const nextPageStartIndex = this._state.page.getPageStartIndex(this.#pageIndex + 1);

        for (const row of this._state.rows.iterator()) {
            if (!this._state.filter.isVisible(row)) continue;

            if (this.#rowCount === pageStartIndex)
                this.#currentPageHead.set(row);
            else if (this.#rowCount === nextPageStartIndex)
                this.#nextPageHead.set(row);

            this.#rowCount++;
        }
    };

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