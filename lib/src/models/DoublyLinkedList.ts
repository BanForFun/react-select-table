const previousSymbol = Symbol('previous');
const nextSymbol = Symbol('next');

export type DoublyLinkedNode<T> = T & {
    [previousSymbol]: DoublyLinkedNode<T> | null;
    [nextSymbol]: DoublyLinkedNode<T> | null;
};

function getNextNode<T>(node: DoublyLinkedNode<T> | null): DoublyLinkedNode<T> | null {
    return node == null ? null : node[nextSymbol];
}

function getPreviousNode<T>(node: DoublyLinkedNode<T> | null): DoublyLinkedNode<T> | null {
    return node == null ? null : node[previousSymbol];
}

class ConstDoublyLinkedNodeWrapper<T> {
    constructor(protected _node: DoublyLinkedNode<T> | null = null) {

    }

    get current() {
        return this._node;
    }

    get previous() {
        return getPreviousNode(this.current);
    }

    get next() {
        return getNextNode(this.current);
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
}

class ReadonlyDoublyLinkedNodeWrapper<T> extends ConstDoublyLinkedNodeWrapper<T> {
    persist() {
        return new ConstDoublyLinkedNodeWrapper(this._node);
    }
}

export class DoublyLinkedNodeWrapper<T> extends ReadonlyDoublyLinkedNodeWrapper<T> {
    clear() {
        this._node = null;
    }

    set(node: DoublyLinkedNode<T> | null): void {
        this._node = node;
    }
}

export default class DoublyLinkedList<T extends object> {
    #head = new DoublyLinkedNodeWrapper<T>();
    #tail = new DoublyLinkedNodeWrapper<T>();

    // #nodeCount: number = 0;

    #link(previous: DoublyLinkedNode<T> | null, node: T, next: DoublyLinkedNode<T> | null): DoublyLinkedNode<T> {
        const linked: DoublyLinkedNode<T> = Object.assign(node, {
            [previousSymbol]: previous,
            [nextSymbol]: next
        });

        if (previous != null)
            previous[nextSymbol] = linked;
        else
            this.#head.set(linked);

        if (next != null)
            next[previousSymbol] = linked;
        else
            this.#tail.set(linked);

        // this.#nodeCount++;
        return linked;
    }

    unlink(node: DoublyLinkedNode<T>) {
        if (node[previousSymbol] != null)
            node[previousSymbol][nextSymbol] = node[nextSymbol];
        else
            this.#head.set(node[nextSymbol]);

        if (node[nextSymbol] != null)
            node[nextSymbol][previousSymbol] = node[previousSymbol];
        else
            this.#tail.set(node[previousSymbol]);

        // this.#nodeCount--;
    }

    order(first: DoublyLinkedNode<T> | null, second: DoublyLinkedNode<T> | null): void {
        if (first != null)
            first[nextSymbol] = second;
        else
            this.#head.set(second);

        if (second != null)
            second[previousSymbol] = first;
        else
            this.#tail.set(first);
    }


    append(node: T, after = this.#tail.current) {
        return this.#link(after, node, getNextNode(after));
    }

    prepend(node: T, before = this.#head.current) {
        return this.#link(getPreviousNode(before), node, before);
    }

    pop() {
        if (this.#tail.current)
            this.unlink(this.#tail.current);
    }

    shift() {
        if (this.#head.current)
            this.unlink(this.#head.current);
    }

    clear() {
        this.#head.clear();
        this.#tail.clear();
        // this.#nodeCount = 0;
    }

    // get length() {
    //     return this.#nodeCount;
    // }

    get head(): ReadonlyDoublyLinkedNodeWrapper<T> {
        return this.#head;
    }

    get tail(): ReadonlyDoublyLinkedNodeWrapper<T> {
        return this.#tail;
    }
}