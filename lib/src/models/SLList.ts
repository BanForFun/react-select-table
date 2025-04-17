import {
    ComparatorCallback, GeneratorPredicateCallback
} from '../utils/typeUtils';
import * as iterableUtils from '../utils/iterableUtils';
import List, { Chain } from './List';

const lengthSymbol = Symbol('length');
const nextSymbol = Symbol('next');

export type SLNode<T = object> = T & {
    [nextSymbol]: SLNode<T> | null;
};

export default class SLList<T extends object = object> implements List<T, SLNode<T>> {
    static* iterator<T>(current: SLNode<T> | null): IterableIterator<SLNode<T>> {
        while (current != null) {
            yield current;
            current = current[nextSymbol];
        }
    }

    [lengthSymbol] = 0;

    #head: SLNode<T> | null = null;
    #tail: SLNode<T> | null = null;

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

    #createNode(data: T, next: SLNode<T> | null): SLNode<T> {
        return Object.assign(data, { [nextSymbol]: next });
    }

    #createChain(items: T[], next: SLNode<T> | null): Chain<SLNode<T>> | null {
        if (!items.length) return null;

        let i;
        for (i = 0; i < items.length - 1; ++i)
            this.#createNode(items[i], items[i + 1] as SLNode<T>);

        return {
            head: items[0] as SLNode<T>,
            tail: this.#createNode(items[i], next),
            length: items.length
        };
    }

    [Symbol.iterator](): Iterator<SLNode<T>> {
        return SLList.iterator(this.#head);
    }

    #updateTailIfEmpty() {
        if (this.#head == null)
            this.#tail = null;
    }

    #setTailIfLast(node: SLNode<T>) {
        if (node[nextSymbol] == null)
            this.#tail = node;
    }

    #getSlice(node: SLNode<T> | null, count: number) {
        const nodes: T[] = [];
        while (count > 0 && node != null) {
            nodes.push(node);
            node = node[nextSymbol];
            count--;
        }

        return { nodes, next: node };
    }

    shift(count: number = 1) {
        const toRemove = this.#getSlice(this.#head, count);

        this.#head = toRemove.next;
        this.#updateTailIfEmpty();
        this.#length -= count;

        return toRemove.nodes;
    }

    unshift(...items: T[]) {
        const chain = this.#createChain(items, this.#head);
        if (!chain) return null;

        this.#head = chain.head;
        this.#setTailIfLast(chain.tail);
        this.#length += chain.length;

        return chain.head;
    }

    removeAfter(node: SLNode<T>, count = 1) {
        const toRemove = this.#getSlice(node[nextSymbol], count);

        node[nextSymbol] = toRemove.next;
        this.#setTailIfLast(node);
        this.#length -= count;

        return toRemove.nodes;
    }

    push(...items: T[]) {
        if (this.#tail == null)
            this.unshift(...items);
        else
            this.insertAfter(this.#tail, ...items);
    }

    insertAfter(node: SLNode<T>, ...items: T[]) {
        const chain = this.#createChain(items, node[nextSymbol]);
        if (!chain) return null;

        node[nextSymbol] = chain.head;
        this.#setTailIfLast(chain.tail);
        this.#length += chain.length;

        return chain.head;
    }

    mergeSorted(items: T[], comparator: ComparatorCallback<T>, allowAppend = true) {
        let newItemIndex = 0;
        let currentItem: SLNode<T> | null = null;
        let nextItem: SLNode<T> | null = this.#head;

        while (newItemIndex < items.length && nextItem != null) {
            const newItem = items[newItemIndex];
            if (comparator(newItem, nextItem) < 0) {
                currentItem = currentItem
                    ? this.insertAfter(currentItem, newItem)
                    : this.unshift(newItem);

                newItemIndex++;
            } else {
                currentItem = nextItem;
                nextItem = nextItem[nextSymbol];
            }
        }

        if (allowAppend) {
            while (newItemIndex < items.length) {
                this.push(items[newItemIndex]);
                newItemIndex++;
            }
        }

        return newItemIndex;
    }

    removeBy(predicate: GeneratorPredicateCallback<T>) {
        const removed: T[] = [];

        let currentItem: SLNode<T> | null = null;
        let nextItem: SLNode<T> | null = this.#head;

        while (nextItem != null) {
            const result = predicate(nextItem);
            if (result.value) {
                if (currentItem)
                    this.removeAfter(currentItem);
                else
                    this.shift();

                removed.push(nextItem);
            } else {
                currentItem = nextItem;
                nextItem = nextItem[nextSymbol];
            }

            if (result.done) break;
        }

        return removed;
    }

    clear() {
        this.#length = 0;
        this.#head = null;
        this.#tail = null;
    }
}
