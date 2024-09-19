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
    Current,
    Last
}

const rowCountSymbol = Symbol('rowCount');

export default class VisibleRowSlice<TData extends TableData> extends UndoableStateSlice<Dependencies<TData>> {
    [rowCountSymbol]: number = 0;
    #pageHead = new DLNodeWrapper<Row<TData>>();
    #pageTail = new DLNodeWrapper<Row<TData>>();
    #pageIndex: number = 0;

    protected _sliceKey: string = 'visibleRows';

    readonly replaced = new Observable();
    readonly added = new Observable();
    readonly removed = new Observable();
    readonly pageIndexChanged = new Observable();
    readonly pageCountChanged = new Observable();

    get pageIndex() {
        return this.#pageIndex;
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
                if (pageIndex >= this.#pageIndex) return;
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
                if (pageIndex <= this.#pageIndex) return;
            }

            visibleIndex--;
        }
    }

    #reloadPage(currentPageIndex: number = Infinity) {
        const lastPageIndex = this.calculatePageCount() - 1;

        // When currentPageIndex is Infinity, it will never be selected as the start page
        const startPage = minBy([
            { type: Pages.First, index: 0 },
            { type: Pages.Current, index: currentPageIndex },
            { type: Pages.Last, index: lastPageIndex }
        ], s => Math.abs(s.index - this.#pageIndex));

        if (startPage.type === Pages.First)
            this.#reloadPageForward(this._state.rows.head.const(), 0);
        else if (startPage.type === Pages.Last)
            this.#reloadPageBackward(this._state.rows.tail.const(), this._rowCount - 1);
        else if (this.#pageIndex > currentPageIndex)
            this.#reloadPageForward(this.#pageTail.const(), this._state.pageSize.calculateEndIndex(currentPageIndex));
        else if (this.#pageIndex < currentPageIndex)
            this.#reloadPageBackward(this.#pageHead.const(), this._state.pageSize.calculateStartIndex(currentPageIndex));
    }

    #invalidatePageIndex() {
        this.setPageIndex(this.#pageIndex, false);
    }

    #processAddedRowsJob = () => {
        this.#reloadPage();
        this.added.notify();
    };

    #processRemovedRowsJob = () => {
        this.#reloadPage();
        this.removed.notify();
    };

    #processChangedRowsJob = () => {
        this.#reloadPage();
        this.replaced.notify();
    };

    constructor(config: OptionalIfPartial<object>, state: Dependencies<TData>) {
        super(config, state);

        state.rows.added.addObserver(added => {
            this._rowCount += count(added, this._state.filter.isVisible);
            this._state.scheduler._add(this.#processAddedRowsJob);
        });

        state.rows.removed.addObserver(removed => {
            this._rowCount -= count(removed, this._state.filter.isVisible);
            this.#invalidatePageIndex();
            this._state.scheduler._add(this.#processRemovedRowsJob);
        });

        state.rows.sorted.addObserver(() => {
            this._state.scheduler._add(this.#processChangedRowsJob);
        });

        state.pageSize.changed.addObserver(() => {
            this.pageCountChanged.notify();
            this.#invalidatePageIndex();
            this._state.scheduler._add(this.#processChangedRowsJob);
        });
    }

    #setPageIndex = this._dispatcher('setPageIndex', (toUndo, index: number, reloadPage: boolean) => {
        if (this.#pageIndex === index) return;

        const originalIndex = this.#pageIndex;
        this.#pageIndex = index;

        if (reloadPage) {
            this.#reloadPage(originalIndex);
            this._state.scheduler._add(this.replaced.notify);
        }

        this.pageIndexChanged.notify();
        toUndo(this.#setPageIndex.action(originalIndex, reloadPage));
    });

    setPageIndex = (index: number, reloadPage: boolean = true) => {
        const lastPageIndex = this.calculatePageCount() - 1;
        return this.#setPageIndex(clamp(index, 0, lastPageIndex), reloadPage);
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