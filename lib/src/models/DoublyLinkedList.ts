export interface DoublyLinkedNode<T> {
    previous: T | null;
    next: T | null;
}

class ReadonlyDoublyLinkedNodeWrapper<T extends DoublyLinkedNode<T>> {
    constructor(protected _node: T | null = null) {

    }

    * nextIterator() {
        let current = this._node;
        while (current != null) {
            yield current;
            current = current.next;
        }
    }

    * previousIterator() {
        let current = this._node;
        while (current != null) {
            yield current;
            current = current.previous;
        }
    }

    persist() {
        return new ReadonlyDoublyLinkedNodeWrapper(this._node);
    }
}

export class DoublyLinkedNodeWrapper<T extends DoublyLinkedNode<T>> extends ReadonlyDoublyLinkedNodeWrapper<T> {
    clear() {
        this._node = null;
    }

    set(node: T | null): void {
        this._node = node;
    }

    get node() {
        return this._node;
    }

    get isSet() {
        return this._node != null;
    }
}

export default class DoublyLinkedList<T extends DoublyLinkedNode<T>> {
    #head = new DoublyLinkedNodeWrapper<T>();
    #tail = new DoublyLinkedNodeWrapper<T>();

    link(previous: T | null, node: T, next: T | null) {
        node.previous = previous;
        if (previous == null)
            this.#head.set(node);
        else
            previous.next = node;

        node.next = next;
        if (next == null)
            this.#tail.set(node);
        else
            next.previous = node;
    }

    order(first: T | null, second: T | null): void {
        if (second == null)
            this.#tail.set(first);
        else
            second.previous = first;

        if (first == null)
            this.#head.set(second);
        else
            first.next = second;
    }

    append(node: T) {
        this.link(this.#tail.node, node, null);
    }

    prepend(node: T) {
        this.link(null, node, this.#head.node);
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