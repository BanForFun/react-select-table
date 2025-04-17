import List, { Chain } from './List';
import { ComparatorCallback } from '../utils/typeUtils';
import * as arrayUtils from '../utils/arrayUtils';
import * as iteratorUtils from '../utils/iteratorUtils';
import { SLNode } from './SLList';

const lengthSymbol = Symbol('length');

const previousSymbol = Symbol('previous');
const nextSymbol = Symbol('next');

export type DLNode<T = object> = T & {
    [previousSymbol]: DLNode<T> | null;
    [nextSymbol]: DLNode<T> | null;
};

function* iterator<T>(current: DLNode<T> | null, direction: keyof DLNode): IterableIterator<DLNode<T>> {
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
    static iterator = <T>(start: DLNode<T> | null) =>
        iterator(start, nextSymbol);

    static reverseIterator = <T>(start: DLNode<T> | null) =>
        iterator(start, previousSymbol);

    [lengthSymbol] = 0;

    #head: DLNode<T> | null = null;
    #tail: DLNode<T> | null = null;

    get #length() {
        return this[lengthSymbol];
    }

    set #length(value: number) {
        this[lengthSymbol] = Math.max(0, value);
    }

    get head() {
        return this.#head;
    }

    get tail() {
        return this.#tail;
    }

    get length() {
        return this.#length;
    }

    #createNode(previous: DLNode<T> | null, data: T, next: DLNode<T> | null): DLNode<T> {
        return Object.assign(data, { [previousSymbol]: previous, [nextSymbol]: next });
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

    #createChain(previous: DLNode<T> | null, items: Iterator<T>, after: DLNode<T> | null): Chain<DLNode<T>> | null {
        const firstResult = items.next();
        if (firstResult.done) return null;

        let length = 0;
        let currentResult = firstResult;
        let nextResult = items.next();

        while (!nextResult.done) {
            previous = this.#createNode(previous, currentResult.value, nextResult.value as DLNode<T>);
            currentResult = nextResult;
            nextResult = items.next();
            length++;
        }

        return {
            head: firstResult.value as DLNode<T>,
            tail: this.#createNode(previous, currentResult.value, after),
            length
        };
    }

    #linkChain(chain: Chain<DLNode<T>>) {
        const previous = chain.head[previousSymbol];
        const next = chain.tail[nextSymbol];

        if (previous != null)
            previous[nextSymbol] = chain.head;
        else
            this.#head = chain.head;

        if (next != null)
            next[previousSymbol] = chain.tail;
        else
            this.#tail = chain.tail;
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

    unshift(items: Iterator<T>) {
        const chain = this.#createChain(null, items, this.#head);
        if (chain == null) return 0;

        this.#linkChain(chain);
        this.#length += chain.length;
    }

    push(items: Iterator<T>) {
        const chain = this.#createChain(this.#tail, items, null);
        if (chain == null) return 0;

        this.#linkChain(chain);
        this.#length += chain.length;
    }

    insertBefore(node: DLNode<T>, items: Iterator<T>) {
        const chain = this.#createChain(node[previousSymbol], items, node);
        if (chain == null) return 0;

        this.#linkChain(chain);
        this.#length += chain.length;
    }

    insertAfter(node: DLNode<T>, items: Iterator<T>) {
        const chain = this.#createChain(node, items, node[nextSymbol]);
        if (chain == null) return 0;

        this.#linkChain(chain);
        this.#length += chain.length;
    }

    mergeSorted(items: T[], comparator: ComparatorCallback<T>, allowAppend = true) {
        let newItemIndex = 0;
        let currentItem = this.#head;

        while (newItemIndex < items.length && currentItem != null) {
            const newItem = items[newItemIndex];
            if (comparator(newItem, currentItem) < 0) {
                this.insertBefore(currentItem, iteratorUtils.singleValue(newItem));
                newItemIndex++;
            } else {
                currentItem = currentItem[nextSymbol];
            }
        }

        if (allowAppend)
            return newItemIndex;

        this.push(arrayUtils.createIterator(items, newItemIndex));
        return items.length;
    }

    unlink(node: DLNode<T>) {
        this.#order(node[previousSymbol], node[nextSymbol]);
        this.#length--;
    }

    clear() {
        this.#length = 0;
        this.#head = null;
        this.#tail = null;
    }
}