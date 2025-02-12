import { TableData } from '../../utils/configUtils';
import Observable from '../Observable';
import DLList, { ConstDLNodeWrapper, DLNode, DLNodeWrapper, getNextNode } from '../DLList';
import SortOrderSlice from './SortOrderSlice';
import SchedulerSlice from './SchedulerSlice';
import { OptionalIfPartial } from '../../utils/types';
import UndoableStateSlice from '../UndoableStateSlice';
import HistorySlice from './HistorySlice';
import PageSlice from './PageSlice';
import FilterSlice from './FilterSlice';
import { filter, first, limit, minBy, skip } from '../../utils/iterableUtils';
import { clamp } from '../../utils/numericUtils';
import Flags from '../Flags';

export type RowKey = string;

interface RowConfig<TData extends TableData> {
    getRowKey: (row: TData['row']) => RowKey;
}

interface Dependencies<TData extends TableData> {
    scheduler: SchedulerSlice;
    sortOrder: SortOrderSlice<TData>;
    history: HistorySlice;
    page: PageSlice;
    filter: FilterSlice<TData>;
}

enum Pages {
    First,
    Old,
    Last
}

enum StateDependencies {
    PageIndex,
    PageSize,
    SortOrder,
    Filter
}

export type Row<TData extends TableData> = TData['row']; //Maybe cache key in the future

export default class RowSlice<TData extends TableData> extends UndoableStateSlice<Dependencies<TData>, RowConfig<TData>> {
    #rows = new DLList<Row<TData>>();
    #visibleCount: number = 0;
    #pageStart = new DLNodeWrapper<Row<TData>>();
    #pageEnd = new DLNodeWrapper<Row<TData>>();
    #updateRequests = new Flags<StateDependencies>();
    #targetPageIndex: number = 0;
    #currentPageIndex: number = 0;

    protected _sliceKey: string = 'rows';

    readonly changed = new Observable();
    readonly pageIndexChanged = new Observable();
    readonly pageCountChanged = new Observable();

    get pageIndex() {
        return this.#targetPageIndex;
    }

    #reloadPageForward(startRow: ConstDLNodeWrapper<Row<TData>>, startVisibleIndex: number) {
        this.#pageStart.clear();

        let visibleIndex = startVisibleIndex;
        this.#currentPageIndex = this._state.page.calculatePageIndex(visibleIndex);

        for (const row of startRow.forwardIterator()) {
            if (!this._state.filter.isVisible(row)) continue;

            if (this._state.page.isStartIndex(visibleIndex)) {
                this.#pageStart.set(row);
                if (visibleIndex !== startVisibleIndex) this.#currentPageIndex++;
            }

            if (this._state.page.isEndIndex(visibleIndex)) {
                this.#pageEnd.set(row);
                if (this.#currentPageIndex >= this.pageIndex) return;
            }

            visibleIndex++;
        }

        this.#pageEnd.clear();
    }

    #reloadPageBackward(startRow: ConstDLNodeWrapper<Row<TData>>, startVisibleIndex: number) {
        this.#pageStart.clear();
        this.#pageEnd.clear();

        let visibleIndex = startVisibleIndex;
        this.#currentPageIndex = this._state.page.calculatePageIndex(visibleIndex);

        for (const row of startRow.backwardIterator()) {
            if (!this._state.filter.isVisible(row)) continue;

            if (this._state.page.isEndIndex(visibleIndex)) {
                this.#pageEnd.set(row);
                if (visibleIndex !== startVisibleIndex) this.#currentPageIndex--;
            }

            if (this._state.page.isStartIndex(visibleIndex)) {
                this.#pageStart.set(row);
                if (this.#currentPageIndex <= this.pageIndex) return;
            }

            visibleIndex--;
        }
    }

    #reloadPage() {
        const lastPageIndex = this.calculatePageCount() - 1;

        // When currentPageIndex is Infinity, it will never be selected as the start page
        const startPage = minBy([
            { type: Pages.First, index: 0 },
            { type: Pages.Old, index: this.#currentPageIndex },
            { type: Pages.Last, index: lastPageIndex }
        ], s => Math.abs(s.index - this.pageIndex));

        if (startPage.type === Pages.First)
            this.#reloadPageForward(this.#rows.head.const(), 0);
        else if (startPage.type === Pages.Last)
            this.#reloadPageBackward(this.#rows.tail.const(), this.#visibleCount - 1);
        else if (this.pageIndex > this.#currentPageIndex)
            this.#reloadPageForward(this.#pageEnd.const(), this._state.page.calculateEndIndex(this.#currentPageIndex));
        else if (this.pageIndex < this.#currentPageIndex)
            this.#reloadPageBackward(this.#pageStart.const(), this._state.page.calculateStartIndex(this.#currentPageIndex));

        this.changed.notify();
    };

    #invalidatePage() {
        this.#currentPageIndex = Infinity;
    }

    #updateJob = () => {
        //TODO: Implement

        if (this.#updateRequests.isSet(StateDependencies.SortOrder)) {

        }

        // if (this.#updateRequests.isSet(StateDependencies.Filter)) {
        //
        // }
        //
        // if (this.#updateRequests.isSet(StateDependencies.PageSize)) {
        //
        // }
        //
        // if (this.#updateRequests.isSet(StateDependencies.PageIndex)) {
        //
        // }
    };

    #requestUpdate(changed: StateDependencies) {
        this.#updateRequests.set(changed);
        this._state.scheduler._add(this.#updateJob);
    }

    #setPageIndex = this._dispatcher('setPageIndex', (toUndo, index: number) => {
        const originalIndex = this.#targetPageIndex;
        if (originalIndex === index) return;

        this.#targetPageIndex = index;
        this.pageIndexChanged.notify();
        this.#requestUpdate(StateDependencies.PageIndex);

        toUndo(this.#setPageIndex.action(originalIndex));
    });

    #firstVisible(iterable: Iterable<DLNode<Row<TData>>>) {
        return first(filter(iterable, this._state.filter.isVisible)) ?? null;
    }

    #nextVisible(iterable: Iterable<DLNode<Row<TData>>>) {
        return this.#firstVisible(skip(iterable, 1));
    }

    #createRow = (data: TData['row']): Row<TData> => data; // Maybe cache key in the future

    #compareRows = (a: Row<TData>, b: Row<TData>) => {
        const comparison = this._state.sortOrder.compareRowData(a, b);
        // comparison.result ||= comparePrimitives(this.getRowKey(a), this.getRowKey(b));

        if (comparison.order === 'ascending')
            return comparison.result;

        return comparison.result * -1;
    };


    constructor(config: OptionalIfPartial<RowConfig<TData>>, state: Dependencies<TData>) {
        super(config, state);

        state.sortOrder.changed.addObserver(() => {
            this.#requestUpdate(StateDependencies.SortOrder);
        });

        state.page.sizeChanged.addObserver(() => {
            this.#requestUpdate(StateDependencies.PageSize);
            this.pageCountChanged.notify();
        });
    }

    getRowKey = (row: Row<TData>) => {
        // Maybe load from cache in the future
        return this.config.getRowKey(row);
    };

    add = this._dispatcher('add', (toUndo, rows: TData['row'][]) => {
        const oldPageCount = this.calculatePageCount();
        const newRows = rows.map(this.#createRow).sort(this.#compareRows);

        let newIndex = 0;
        let existingRow = this.#rows.head.current;
        let lastAddedRow: DLNode<Row<TData>> | undefined = undefined;
        let passedStart = false, passedEnd = false;

        while (existingRow != null || newIndex < newRows.length) {
            passedStart ||= (lastAddedRow === this.#pageStart.current);
            passedEnd ||= (lastAddedRow === this.#pageEnd.current);

            if (existingRow == null) {
                lastAddedRow = this.#rows.append(newRows[newIndex]);
                newIndex++;
            } else if (newIndex < newRows.length && this.#compareRows(newRows[newIndex], existingRow) < 0) {
                lastAddedRow = this.#rows.prepend(newRows[newIndex], existingRow);
                newIndex++;
            } else {
                lastAddedRow = existingRow;
                existingRow = getNextNode(existingRow);
                continue;
            }

            if (!this._state.filter.isVisible(lastAddedRow)) continue;

            this.#visibleCount++;
            const lastIndex = this.#visibleCount - 1;

            if (!passedStart)
                this.#pageStart.set(this.#nextVisible(this.#pageStart.backwardIterator()));

            if (!passedEnd)
                this.#pageEnd.set(this.#nextVisible(this.#pageEnd.backwardIterator()));

            if (lastIndex === 0)
                this.#pageStart.set(lastAddedRow);

            if (this.#pageEnd.current == null && this._state.page.isEndIndex(lastIndex))
                this.#pageEnd.set(this.#firstVisible(this.#rows.tail.backwardIterator()));
        }

        this.changed.notify();

        if (this.calculatePageCount() !== oldPageCount)
            this.pageCountChanged.notify();

        const keys = new Set<RowKey>();
        for (const row of newRows)
            keys.add(this.getRowKey(row));

        toUndo(this.remove.action(keys));
    });

    remove = this._dispatcher('remove', (toUndo, keys: Set<RowKey>) => {
        const rowIterator = this.#rows.head.forwardIterator();
        const removed: Row<TData>[] = [];
        let previousRow: DLNode<Row<TData>> | undefined = undefined;
        let passedStart = false, passedEnd = false;
        let rowResult: IteratorResult<DLNode<Row<TData>>, void>;
        let removedPages = false;

        while (keys.size > 0) {
            rowResult = rowIterator.next();
            if (rowResult.done) break;

            passedStart ||= (previousRow === this.#pageStart.current);
            passedEnd ||= (previousRow === this.#pageEnd.current);
            previousRow = rowResult.value;

            const key = this.getRowKey(previousRow);
            if (!keys.delete(key)) continue;

            removed.push(previousRow);
            this.#rows.unlink(previousRow);

            if (!this._state.filter.isVisible(previousRow)) continue;

            const oldLastIndex = this.#visibleCount - 1;
            this.#visibleCount--;

            if (removedPages) continue;

            if (!passedStart)
                this.#pageStart.set(this.#nextVisible(this.#pageStart.forwardIterator()));

            if (!passedEnd)
                this.#pageEnd.set(this.#nextVisible(this.#pageEnd.forwardIterator()));

            if (oldLastIndex === this._state.page.calculateStartIndex(this.#currentPageIndex))
                removedPages = true;

            if (oldLastIndex === this._state.page.calculateEndIndex(this.#currentPageIndex))
                this.#pageEnd.clear();
        }

        if (removedPages) {
            //TODO: Update page index
            this.#reloadPageBackward(this.#rows.tail.const(), this.#visibleCount - 1);
            this.pageCountChanged.notify();
        }

        this.changed.notify();

        toUndo(this.add.action(removed));
    });

    setPageIndex = (index: number) => {
        const lastPageIndex = this.calculatePageCount() - 1;
        return this.#setPageIndex(clamp(index, 0, lastPageIndex));
    };

    calculatePageCount() {
        return this._state.page.calculatePageCount(this.#visibleCount);
    }

    iterator() {
        const visibleRows = filter(this.#pageStart.forwardIterator(), this._state.filter.isVisible);
        return limit(visibleRows, this._state.page.size);
    }
}