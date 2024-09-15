import Observable from '../Observable';
import UndoableStateSlice from '../UndoableStateSlice';

export default class PageSizeSlice extends UndoableStateSlice {
    #value: number = Infinity;

    protected _sliceKey: string = 'pageSize';

    readonly changed = new Observable();

    get value() {
        return this.#value;
    }

    calculatePageIndex(visibleIndex: number) {
        return Math.floor(visibleIndex / this.value);
    }

    calculatePageCount(visibleCount: number) {
        return Math.max(Math.ceil(visibleCount / this.value), 1);
    }

    calculateStartIndex(pageIndex: number) {
        if (pageIndex === 0) return 0;
        return pageIndex * this.value;
    }

    calculateEndIndex(pageIndex: number) {
        return this.calculateStartIndex(pageIndex) + this.value - 1;
    }

    isStartIndex(index: number) {
        return index % this.value === 0;
    }

    isEndIndex(index: number) {
        return this.isStartIndex(index + 1);
    }

    set = this._dispatcher('set', (toUndo, size: number) => {
        if (size <= 0)
            throw new Error('Page size must be positive');

        const original = this.#value;
        this.#value = size;
        if (this.#value === original) return;

        this.changed.notify();
        toUndo(this.set.action(original));
    });
}