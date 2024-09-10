const previousSymbol = Symbol('previous');
const nextSymbol = Symbol('next');

export type DLNode<T = unknown> = T & {
    [previousSymbol]: DLNode<T> | null;
    [nextSymbol]: DLNode<T> | null;
};

type Comparator<T> = (a: T, b: T) => number;
type Predicate<T> = (item: T) => boolean;

function getNextNode<T>(node: DLNode<T> | null): DLNode<T> | null {
    return node == null ? null : node[nextSymbol];
}

function getPreviousNode<T>(node: DLNode<T> | null): DLNode<T> | null {
    return node == null ? null : node[previousSymbol];
}

class BaseDLNodeWrapper<T> {
    constructor(protected _node: DLNode<T> | null = null) {

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

    * #iterator(direction: keyof DLNode) {
        let current = this._node;
        while (current != null) {
            yield current;
            current = current[direction];
        }
    }

    forwardIterator() {
        return this.#iterator(nextSymbol);
    }

    backwardIterator() {
        return this.#iterator(previousSymbol);
    }
}

export class ConstDLNodeWrapper<T> extends BaseDLNodeWrapper<T> {
    readonly isConstant = true;
}

export class ReadonlyDLNodeWrapper<T> extends BaseDLNodeWrapper<T> {
    readonly isConstant = false;

    const() {
        return new ConstDLNodeWrapper(this._node);
    }
}

export class DLNodeWrapper<T> extends ReadonlyDLNodeWrapper<T> {
    clear() {
        this._node = null;
    }

    set(node: DLNode<T> | null): void {
        this._node = node;
    }
}

export default class DLList<T extends object = object> {
    #head = new DLNodeWrapper<T>();
    #tail = new DLNodeWrapper<T>();

    // #nodeCount: number = 0;

    #link(previous: DLNode<T> | null, node: T, next: DLNode<T> | null): DLNode<T> {
        const linked: DLNode<T> = Object.assign(node, {
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

    #order(first: DLNode<T> | null, second: DLNode<T> | null): void {
        if (first != null)
            first[nextSymbol] = second;
        else
            this.#head.set(second);

        if (second != null)
            second[previousSymbol] = first;
        else
            this.#tail.set(first);
    }

    sort(comparator: Comparator<T>) {
        const nodes = [...this.head.forwardIterator()].sort(comparator);

        let prevNode: DLNode<T> | null = null;
        for (const node of nodes) {
            this.#order(prevNode, node);
            prevNode = node;
        }

        this.#order(prevNode, null);
    }

    unlink(node: DLNode<T>) {
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

    unlinkRight(node: DLNode<T>) {
        this.#order(node[previousSymbol], null);
    }

    unlinkLeft(node: DLNode<T>) {
        this.#order(null, node[nextSymbol]);
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

    add(items: T[], comparator: Comparator<T>) {
        items.sort(comparator);

        let newIndex = 0;
        let existingItem = this.#head.current;

        while (existingItem != null || newIndex < items.length) {
            if (existingItem == null)
                this.append(items[newIndex++]);
            else if (newIndex < items.length && comparator(items[newIndex], existingItem) < 0)
                this.prepend(items[newIndex++], existingItem);
            else
                existingItem = existingItem[nextSymbol];
        }
    }

    remove(predicate: Predicate<T>) {
        const removed: T[] = [];
        for (const node of this.head.forwardIterator()) {
            if (!predicate(node)) continue;
            this.unlink(node);
            removed.push(node);
        }

        return removed;
    }

    clear() {
        this.#head.clear();
        this.#tail.clear();
        // this.#nodeCount = 0;
    }

    // get length() {
    //     return this.#nodeCount;
    // }

    get head(): ReadonlyDLNodeWrapper<T> {
        return this.#head;
    }

    get tail(): ReadonlyDLNodeWrapper<T> {
        return this.#tail;
    }
}

type Functions = keyof DLList;

type Allow<T extends Functions> = T;

export type Sorted = Allow<'sort' | 'unlink' | 'unlinkLeft' | 'unlinkRight' | 'pop' | 'shift' | 'add' | 'remove' | 'clear' | 'head' | 'tail'>

export type RestrictedDLList<T extends object, TAllow extends Functions> =
    DLList<T> & Record<Exclude<Functions, TAllow>, never>;