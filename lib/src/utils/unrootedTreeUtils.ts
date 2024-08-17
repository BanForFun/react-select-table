import { optional } from './types';

interface NodeLike<T> {
    children?: (T & NodeLike<T>)[];
}

export type TreePath = readonly number[];

export function getAtPath<T extends NodeLike<T>>(rootChildren: T[], path: TreePath): T {
    let children = optional(rootChildren);
    let node: T | undefined;

    for (const index of path) {
        node = children?.[index];
        if (node == null)
            throw new Error('Invalid path');

        children = node.children;
    }

    if (node == null)
        throw new Error('Empty path given');

    return node;
}