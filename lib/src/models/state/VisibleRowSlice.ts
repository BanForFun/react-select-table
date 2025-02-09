import { TableData } from '../../utils/configUtils';
import PageSizeSlice from './PageSizeSlice';
import RowSlice, { Row } from './RowSlice';
import { DLNodeWrapper, ConstDLNodeWrapper } from '../DLList';
import FilterSlice from './FilterSlice';
import Observable from '../Observable';
import SchedulerSlice from './SchedulerSlice';
import { OptionalIfPartial } from '../../utils/types';
import { count, minBy } from '../../utils/iterableUtils';
import UndoableStateSlice from '../UndoableStateSlice';
import HistorySlice from './HistorySlice';
import { clamp } from '../../utils/numericUtils';

interface Dependencies<TData extends TableData> {
    history: HistorySlice;
    scheduler: SchedulerSlice;
    pageSize: PageSizeSlice;
    filter: FilterSlice<TData>;
    rows: RowSlice<TData>;
}

enum Pages {
    First,
    Old,
    Last
}

const rowCountSymbol = Symbol('rowCount');
const pageIndexSymbol = Symbol('targetPageIndex');

export default class VisibleRowSlice<TData extends TableData> extends UndoableStateSlice<Dependencies<TData>> {
    [rowCountSymbol]: number = 0;
    [pageIndexSymbol]: number = 0;
    #pageHead = new DLNodeWrapper<Row<TData>>();
    #pageTail = new DLNodeWrapper<Row<TData>>();
    #oldPageIndex: number = 0;

    protected _sliceKey: string = 'visibleRows';

    readonly changed = new Observable();
    readonly pageIndexChanged = new Observable();
    readonly pageCountChanged = new Observable();

    get pageIndex() {
        return this[pageIndexSymbol];
    }

    private get _rowCount() {
        return this[rowCountSymbol];
    }

    private set _rowCount(value: number) {
        const original = this.calculatePageCount();
        this[rowCountSymbol] = value;
        if (this.calculatePageCount() === original) return;

        this.pageCountChanged.notify();
    }

    #reloadPageForward(startRow: ConstDLNodeWrapper<Row<TData>>, startVisibleIndex: number) {
        this.#pageHead.clear();

        let visibleIndex = startVisibleIndex;
        let pageIndex = this._state.pageSize.calculatePageIndex(visibleIndex);

        for (const row of startRow.forwardIterator()) {
            if (!this._state.filter.isVisible(row)) continue;

            if (this._state.pageSize.isStartIndex(visibleIndex)) {
                this.#pageHead.set(row);
                if (visibleIndex !== startVisibleIndex) pageIndex++;
            } else if (this._state.pageSize.isEndIndex(visibleIndex)) {
                this.#pageTail.set(row);
                if (pageIndex >= this.pageIndex) return;
            }

            visibleIndex++;
        }

        this.#pageTail.clear();
    }

    #reloadPageBackward(startRow: ConstDLNodeWrapper<Row<TData>>, startVisibleIndex: number) {
        this.#pageHead.clear();
        this.#pageTail.clear();

        let visibleIndex = startVisibleIndex;
        let pageIndex = this._state.pageSize.calculatePageIndex(visibleIndex);

        for (const row of startRow.backwardIterator()) {
            if (!this._state.filter.isVisible(row)) continue;

            if (this._state.pageSize.isEndIndex(visibleIndex)) {
                this.#pageTail.set(row);
                if (visibleIndex !== startVisibleIndex) pageIndex--;
            } else if (this._state.pageSize.isStartIndex(visibleIndex)) {
                this.#pageHead.set(row);
                if (pageIndex <= this.pageIndex) return;
            }

            visibleIndex--;
        }
    }

    #reloadPageJob = () => {
        const lastPageIndex = this.calculatePageCount() - 1;

        // When currentPageIndex is Infinity, it will never be selected as the start page
        const startPage = minBy([
            { type: Pages.First, index: 0 },
            { type: Pages.Old, index: this.#oldPageIndex },
            { type: Pages.Last, index: lastPageIndex }
        ], s => Math.abs(s.index - this.pageIndex));

        if (startPage.type === Pages.First)
            this.#reloadPageForward(this._state.rows.head.const(), 0);
        else if (startPage.type === Pages.Last)
            this.#reloadPageBackward(this._state.rows.tail.const(), this._rowCount - 1);
        else if (this.pageIndex > this.#oldPageIndex)
            this.#reloadPageForward(this.#pageTail.const(), this._state.pageSize.calculateEndIndex(this.#oldPageIndex));
        else if (this.pageIndex < this.#oldPageIndex)
            this.#reloadPageBackward(this.#pageHead.const(), this._state.pageSize.calculateStartIndex(this.#oldPageIndex));

        this.#oldPageIndex = this.pageIndex;
        this.changed.notify();
    };

    #invalidatePage() {
        this.#oldPageIndex = Infinity;
        this._state.scheduler._add(this.#reloadPageJob);
    }

    #clampPageIndex() {
        this.setPageIndex(this.pageIndex);
    }

    constructor(config: OptionalIfPartial<object>, state: Dependencies<TData>) {
        super(config, state);

        state.rows.added.addObserver(added => {
            this._rowCount += count(added, this._state.filter.isVisible);
            this.#invalidatePage();
        });

        state.rows.removed.addObserver(removed => {
            this._rowCount -= count(removed, this._state.filter.isVisible);
            this.#clampPageIndex();
            this.#invalidatePage();
        });

        state.rows.sorted.addObserver(() => {
            this.#invalidatePage();
        });

        state.pageSize.changed.addObserver(() => {
            this.pageCountChanged.notify();
            this.#clampPageIndex();
            this.#invalidatePage();
        });
    }

    #setPageIndex = this._dispatcher('setPageIndex', (toUndo, index: number) => {
        const originalIndex = this[pageIndexSymbol];
        if (originalIndex === index) return;

        this[pageIndexSymbol] = index;
        this.pageIndexChanged.notify();
        this._state.scheduler._add(this.#reloadPageJob);

        toUndo(this.#setPageIndex.action(originalIndex));
    });

    setPageIndex = (index: number) => {
        const lastPageIndex = this.calculatePageCount() - 1;
        return this.#setPageIndex(clamp(index, 0, lastPageIndex));
    };

    calculatePageCount() {
        return this._state.pageSize.calculatePageCount(this._rowCount);
    }

    * iterator() {
        let visibleIndex = 0;
        for (const row of this.#pageHead.forwardIterator()) {
            if (visibleIndex >= this._state.pageSize.value) break;
            if (!this._state.filter.isVisible(row)) continue;

            visibleIndex++;
            yield row;
        }
    }
}