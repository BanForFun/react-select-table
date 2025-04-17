import { ComparatorCallback, GeneratorPredicateCallback } from '../utils/typeUtils';

export default interface List<TItem extends object, TNode> extends Iterable<TNode> {
    get head(): TNode | null;

    get tail(): TNode | null;

    get length(): number;

    unshift(...items: TItem[]): void;

    shift(count?: number): TItem[];

    insertAfter(node: TNode, ...items: TItem[]): void;

    removeAfter(node: TNode, count?: number): TItem[];

    push(...items: TItem[]): void;

    mergeSorted(items: TItem[], comparator: ComparatorCallback<TItem>): void;

    removeBy(predicate: GeneratorPredicateCallback<TItem>): TItem[];

    clear(): void;
}

export interface Chain<TNode> {
    head: TNode;
    tail: TNode;
    length: number;
}