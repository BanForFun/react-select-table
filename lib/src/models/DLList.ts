const previousSymbol = Symbol('previous');
const nextSymbol = Symbol('next');

export type DLNode<T> = T & {
    [previousSymbol]: DLNode<T> | null;
    [nextSymbol]: DLNode<T> | null;
};

type Chain<T> = Readonly<{
    head: DLNode<T>;
    tail: DLNode<T>;
    length: number;
}>

function* iterator<T>(current: DLNode<T> | null, direction: keyof DLNode<unknown>): IterableIterator<DLNode<T>> {
    while (current != null) {
        yield current;
        current = current[direction];
    }
}

//region Unused

// type Origin<T> = Readonly<{
//     index: number;
//     node: DLNode<T>;
// }>

// function createOrigin<T>(node: DLNode<T> | null, index: number): Origin<T> {
//     if (!node) throw new Error('List is empty');
//     return { node, index };
// }

// function createChain<T>(start: Origin<T>, end: Origin<T>): Chain<T> {
//     let head = start;
//     let tail = end;
//
//     if (end.index < start.index) {
//         head = end;
//         tail = start;
//     }
//
//     return {
//         head: head.node,
//         tail: tail.node,
//         length: tail.index - head.index
//     };
// }
//
// function pickOrigin<T>(index: number, ...origins: Origin<T>[]) {
//     const best = minBy(origins, o => Math.abs(o.index - index));
//     if (!best) throw new Error('No origins provided');
//
//     return best;
// }

// function findByIndex<T>(index: number, origin: Origin<T>): Origin<T> {
//     const offset = index - origin.index;
//     const forward = offset > 0;
//     const steps = Math.abs(offset);
//
//     const iteratorFactory = forward ? DLList.forwardIterator : DLList.backwardIterator;
//     const node = at(iteratorFactory(origin.node), steps);
//     if (!node) throw new Error('Index out of range');
//
//     return { node, index };
// }

//endregion

export default class DLList<T extends object = object> implements Iterable<DLNode<T>> {
    static getNext = <T>(node: DLNode<T> | null) =>
        node == null ? null : node[nextSymbol];

    static getPrevious = <T>(node: DLNode<T> | null) =>
        node == null ? null : node[previousSymbol];

    static iterator = <T>(start: DLNode<T> | null) =>
        iterator(start, nextSymbol);

    static reverseIterator = <T>(start: DLNode<T> | null) =>
        iterator(start, previousSymbol);

    #head: DLNode<T> | null = null;
    #tail: DLNode<T> | null = null;
    #count = 0;

    get head() {
        return this.#head;
    }

    get tail() {
        return this.#tail;
    }

    get count() {
        return this.#count;
    }

    get isEmpty() {
        return this.#count === 0;
    }

    #node(previous: DLNode<T> | null, data: T, next: DLNode<T> | null): DLNode<T> {
        return Object.assign(data, { [previousSymbol]: previous, [nextSymbol]: next });
    }

    #link(previous: DLNode<T> | null, node: T, next: DLNode<T> | null): DLNode<T> {
        const linked: DLNode<T> | null = this.#node(previous, node, next);

        if (previous != null)
            previous[nextSymbol] = linked;
        else
            this.#head = linked;

        if (next != null)
            next[previousSymbol] = linked;
        else
            this.#tail = linked;

        return linked;
    }

    #order(first: DLNode<T> | null, second: DLNode<T> | null): void {
        if (first != null)
            first[nextSymbol] = second;
        else
            this.#head = second;

        if (second != null)
            second[previousSymbol] = first;
        else
            this.#tail = first;
    }

    #chain(items: T[]): Chain<T> {
        if (!items.length) throw new Error('No items provided');

        for (let i = 0; i < items.length; ++i)
            this.#node((items[i - 1] as DLNode<T>) ?? null, items[i], (items[i + 1] as DLNode<T>) ?? null);

        return {
            head: items.at(0) as DLNode<T>,
            tail: items.at(-1) as DLNode<T>,
            length: items.length
        };
    }

    //region Unused

    // #headOrigin() {
    //     return createOrigin(this.#head, 0);
    // }
    //
    // #tailOrigin() {
    //     return createOrigin(this.#tail, this.#count - 1);
    // }

    // #pickOrigin(index: number, ...additionalOrigins: Origin<T>[]) {
    //     return pickOrigin(index, this.#headOrigin(), this.#tailOrigin(), ...additionalOrigins);
    // }

    // #findByIndex(index: number, ...additionalOrigins: Origin<T>[]) {
    //     const origin = this.#pickOrigin(index, ...additionalOrigins);
    //     return findByIndex(index, origin);
    // }

    // #partition(startIndex: number, endIndex: number): Chain<T> {
    //     const start = this.#findByIndex(startIndex);
    //     const end = this.#findByIndex(endIndex, start);
    //     return createChain(start, end);
    // }
    //
    // #transplant(old: Chain<T>, replacement: Chain<T>) {
    //     this.#order(DLList.getPrevious(old.head), replacement.head);
    //     this.#order(replacement.tail, DLList.getNext(old.tail));
    //     this.#count += replacement.length - old.length;
    // }
    //
    // #isValidIndex(index: number) {
    //     return inRange(index, 0, this.#count - 1);
    // }

    // overwrite(index: number, rows: T[]) {
    //     if (!rows.length) return;
    //
    //     if (!this.#isValidIndex(index))
    //         throw new Error('Invalid index');
    //
    //     const lastIndex = Math.min(this.#count, index + rows.length) - 1;
    //     this.#transplant(this.#partition(index, lastIndex), this.#chain(rows));
    // }

    // addSorted(items: T[], comparator: ComparatorCallback<T>) {
    //     const sortedItems = createIterator(items.sort(comparator));
    //
    //     let item = sortedItems.next();
    //     let existingItem = this.#head;
    //
    //     while (!item.done) {
    //         if (existingItem == null) {
    //             this.append(item.value);
    //             item = sortedItems.next();
    //         } else if (comparator(item.value, existingItem) < 0) {
    //             this.prepend(item.value, existingItem);
    //             item = sortedItems.next();
    //         } else {
    //             existingItem = existingItem[nextSymbol];
    //         }
    //     }
    // }
    //
    // remove(predicate: PredicateCallback<T>) {
    //     const removed: T[] = [];
    //     for (const node of DLList.forwardIterator(this.head)) {
    //         if (!predicate(node)) continue;
    //         this.unlink(node);
    //         removed.push(node);
    //     }
    //
    //     return removed;
    // }

    //endregion

    [Symbol.iterator](): Iterator<DLNode<T>> {
        return DLList.iterator(this.head);
    }

    reverseIterator(): IterableIterator<DLNode<T>> {
        return DLList.reverseIterator(this.tail);
    }

    unlink(node: DLNode<T>) {
        this.#count--;
        this.#order(node[previousSymbol], node[nextSymbol]);
    }

    append(node: T, after = this.#tail) {
        this.#count++;
        return this.#link(after, node, DLList.getNext(after));
    }

    prepend(node: T, before = this.#head) {
        this.#count++;
        return this.#link(DLList.getPrevious(before), node, before);
    }

    replace(old: DLNode<T>, replacement: T) {
        this.#link(DLList.getPrevious(old), replacement, DLList.getNext(old));
    }

    pop() {
        if (this.#tail)
            this.unlink(this.#tail);
    }

    shift() {
        if (this.#head)
            this.unlink(this.#head);
    }

    push(rows: T[]) {
        if (!rows.length) return;

        const chain = this.#chain(rows);
        this.#order(this.#tail, chain.head);
        this.#order(chain.tail, null);

        this.#count += rows.length;
    }

    clear() {
        this.#count = 0;
        this.#head = null;
        this.#tail = null;
    }
}