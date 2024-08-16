interface NodeLike<T> {
    children?: (T & NodeLike<T>)[];
}

export type TreePath = readonly number[];

export function getChildrenAtPath<T extends NodeLike<T>>(rootChildren: T[], path: TreePath): T[] | null {
    let children: T[] | null = rootChildren;
    for (let pathIndex = 0; pathIndex < path.length; pathIndex++) {
        if (children == null)
            throw new Error('Tree path too long');

        const child: T = children[path[pathIndex]];
        if (child == null)
            throw new Error('Invalid tree path');

        children = child.children ?? null;
    }

    return children;
}