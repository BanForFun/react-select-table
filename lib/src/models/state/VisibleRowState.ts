import { Config, TableData } from '../../utils/configUtils';
import JobBatch from '../JobBatch';
import PageState from './PageState';
import RowState, { Row } from './RowState';
import { DoublyLinkedNodeWrapper } from '../DoublyLinkedList';
import FilterState from './FilterState';
import { Event } from '../Observable';

export default class VisibleRowState<TData extends TableData> {
    #currentPageHead = new DoublyLinkedNodeWrapper<Row<TData>>();
    #nextPageHead = new DoublyLinkedNodeWrapper<Row<TData>>();
    #pageIndex: number = 0;
    #rowCount: number = 0;

    readonly changed = new Event();

    constructor(
        private _config: Config<TData>,
        private _jobBatch: JobBatch,
        private _pageSizeState: PageState<TData>,
        private _filterState: FilterState<TData>,
        private _rowState: RowState<TData>
    ) {
        this._rowState.changed.addObserver(this.#rebuildPage);
    }

    #rebuildPage = () => {
        this.#rowCount = 0;
        this.#currentPageHead.clear();
        this.#nextPageHead.clear();

        const pageStartIndex = this.#pageIndex * this._pageSizeState.size;
        const nextPageStartIndex = (this.#pageIndex + 1) * this._pageSizeState.size;

        for (const row of this._rowState.iterator()) {
            if (!this._filterState.isVisible(row)) continue;

            if (this.#rowCount === pageStartIndex)
                this.#currentPageHead.set(row);
            else if (this.#rowCount === nextPageStartIndex)
                this.#nextPageHead.set(row);

            this.#rowCount++;
        }
        
        this._jobBatch.add(this.changed.notify);
    };

    * iterator() {
        let i = 0;
        for (const row of this.#currentPageHead.forwardIterator()) {
            if (this._pageSizeState.size > 0 && i++ >= this._pageSizeState.size) break;
            yield row;
        }
    }
}