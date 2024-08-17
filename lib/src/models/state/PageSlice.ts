import StateSlice from '../StateSlice';

export default class PageSlice extends StateSlice {
    #size: number = Infinity;

    // getPageStartIndex(pageIndex: number) {
    //     if (pageIndex === 0) return 0;
    //     if (!isFinite(this.#size)) return Infinity;
    //
    //     return this.#size * pageIndex;
    // };

    get size() {
        return this.#size;
    }
}