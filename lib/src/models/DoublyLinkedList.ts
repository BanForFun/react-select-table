const previousSymbol = Symbol('previous');
const nextSymbol = Symbol('next');

export type DoublyLinkedNode<T> = T & {
    [previousSymbol]: DoublyLinkedNode<T> | null;
    [nextSymbol]: DoublyLinkedNode<T> | null;
};

class ReadonlyDoublyLinkedNodeWrapper<T> {
    constructor(protected _node: DoublyLinkedNode<T> | null = null) {

    }

    * forwardIterator() {
        let current = this._node;
        while (current != null) {
            yield current;
            current = current[nextSymbol];
        }
    }

    * backwardIterator() {
        let current = this._node;
        while (current != null) {
            yield current;
            current = current[previousSymbol];
        }
    }

    persist() {
        return new ReadonlyDoublyLinkedNodeWrapper(this._node);
    }
}

export class DoublyLinkedNodeWrapper<T> extends ReadonlyDoublyLinkedNodeWrapper<T> {
    clear() {
        this._node = null;
    }

    set(node: DoublyLinkedNode<T> | null): void {
        this._node = node;
    }

    get node() {
        return this._node;
    }
}

function getNext<T>(node: DoublyLinkedNode<T> | null): DoublyLinkedNode<T> | null {
    return node == null ? null : node[nextSymbol];
}

function getPrevious<T>(node: DoublyLinkedNode<T> | null): DoublyLinkedNode<T> | null {
    return node == null ? null : node[previousSymbol];
}

export default class DoublyLinkedList<T extends object> {
    #head = new DoublyLinkedNodeWrapper<T>();
    #tail = new DoublyLinkedNodeWrapper<T>();

    link(previous: DoublyLinkedNode<T> | null, node: T, next: DoublyLinkedNode<T> | null): DoublyLinkedNode<T> {
        const linked: DoublyLinkedNode<T> = Object.assign(node, {
            [previousSymbol]: previous,
            [nextSymbol]: next
        });

        if (previous == null)
            this.#head.set(linked);
        else
            previous[nextSymbol] = linked;

        if (next == null)
            this.#tail.set(linked);
        else
            next[previousSymbol] = linked;

        return linked;
    }

    order(first: DoublyLinkedNode<T> | null, second: DoublyLinkedNode<T> | null): void {
        if (second == null)
            this.#tail.set(first);
        else
            second[previousSymbol] = first;

        if (first == null)
            this.#head.set(second);
        else
            first[nextSymbol] = second;
    }

    append(node: T, after = this.#tail.node) {
        return this.link(after, node, getNext(after));
    }

    prepend(node: T, before = this.#head.node) {
        return this.link(getPrevious(before), node, before);
    }

    clear() {
        this.#head.clear();
        this.#tail.clear();
    }

    get head(): ReadonlyDoublyLinkedNodeWrapper<T> {
        return this.#head;
    }

    get tail(): ReadonlyDoublyLinkedNodeWrapper<T> {
        return this.#tail;
    }
}