import Observable from '../Observable';
import UndoableStateSlice from '../UndoableStateSlice';

export default class PageSlice extends UndoableStateSlice {
    #size: number = Infinity;

    protected _sliceKey: string = 'page';

    readonly sizeChanged = new Observable();

    get size() {
        return this.#size;
    }

    calculatePageIndex(visibleIndex: number) {
        return Math.floor(visibleIndex / this.size);
    }

    calculatePageCount(visibleCount: number) {
        return Math.max(Math.ceil(visibleCount / this.size), 1);
    }

    calculateStartIndex(pageIndex: number) {
        if (pageIndex === 0) return 0;
        return pageIndex * this.size;
    }

    calculateEndIndex(pageIndex: number) {
        return this.calculateStartIndex(pageIndex) + this.size - 1;
    }

    isStartIndex(index: number) {
        return index % this.size === 0;
    }

    isEndIndex(index: number) {
        return this.isStartIndex(index + 1);
    }

    setSize = this._dispatcher('setSize', (toUndo, size: number) => {
        if (size <= 0)
            throw new Error('Page size must be positive');

        const original = this.#size;
        this.#size = size;
        if (this.#size === original) return;

        this.sizeChanged.notify();
        toUndo(this.setSize.action(original));
    });
}