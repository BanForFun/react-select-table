import { Config, TableData } from '../../utils/configUtils';
import JobScheduler from '../JobScheduler';
import PageState from './PageState';
import RowState, { Row } from './RowState';
import { DoublyLinkedNodeWrapper } from '../DoublyLinkedList';
import FilterState from './FilterState';
import { Event } from '../Observable';
import Dependent from '../Dependent';

interface Dependencies<TData extends TableData> {
    page: PageState<TData>;
    filter: FilterState<TData>;
    rows: RowState<TData>;
}

export default class VisibleRowState<TData extends TableData> extends Dependent<Dependencies<TData>> {
    #currentPageHead = new DoublyLinkedNodeWrapper<Row<TData>>();
    #nextPageHead = new DoublyLinkedNodeWrapper<Row<TData>>();
    #pageIndex: number = 0;
    #rowCount: number = 0;

    readonly changed = new Event();
    readonly added = new Event();

    constructor(
        private _config: Config<TData>,
        private _scheduler: JobScheduler,
        private _state: Dependencies<TData>
    ) {
        super(_state);

        this._state.rows.added.addObserver(() => {
            this.#rebuildPage();
            this._scheduler.add(this.added.notify);
        });
    }

    #rebuildPage = () => {
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