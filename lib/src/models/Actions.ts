import { Column } from '../utils/columnUtils';
import { VisibleColumn } from './State';
import { TreePath } from '../utils/unrootedTreeUtils';
import { Controller } from '../index';

interface ColumnChildren<TRow> {
    all: Column<TRow>[];
    visible: VisibleColumn[];
}

export default class ActionHandlers<TRow, TFilter> {
    #controller: Controller<TRow, TFilter>;

    constructor(controller: Controller<TRow, TFilter>) {
        this.#controller = controller;
    }

    #createVisibleColumn(index: number, from: Column<TRow>): {
        column: VisibleColumn,
        children: ColumnChildren<TRow> | null
    } {
        if (from == null)
            throw new Error('Invalid reference column');

        if (from.children == null) return {
            column: { index, width: this.#controller.config.defaultColumnWidthPc },
            children: null
        };

        const children: VisibleColumn[] = [];
        return {
            column: { index, children: children },
            children: {
                all: from.children,
                visible: children
            }
        };
    }

    #makeAllChildrenVisible(children: ColumnChildren<TRow>): Column<TRow>[] {
        const addedLeafColumns: Column<TRow>[] = [];
        const childrenQueue: ColumnChildren<TRow>[] = [children];
        while (childrenQueue.length) {
            const children = childrenQueue.pop()!;
            for (let i = children.all.length - 1; i >= 0; i--) {
                const referenceColumn = children.all[i];
                const addedColumn = this.#createVisibleColumn(i, referenceColumn);
                children.visible.push(addedColumn.column);

                if (addedColumn.children == null) {
                    addedLeafColumns.push(referenceColumn);
                    continue;
                }

                childrenQueue.push(addedColumn.children);
            }
        }

        return addedLeafColumns;
    }

    #getAddedColumnSiblings(columnPath: TreePath, visibleColumnPath: TreePath): ColumnChildren<TRow> {
        if (columnPath.length === 0)
            throw new Error('Empty column path given');

        if (columnPath.length < visibleColumnPath.length)
            throw new Error('Cannot merge column groups');

        let children: ColumnChildren<TRow> = {
            all: this.#controller.config.columns,
            visible: this.#controller.state.visibleColumns
        };
        for (let pathIndex = 0; pathIndex < visibleColumnPath.length - 1; pathIndex++) {
            const columnIndex = columnPath[pathIndex];
            const column = children.all[columnIndex];

            if (column?.children == null)
                throw new Error('Invalid column path');

            const visibleColumnIndex = visibleColumnPath[pathIndex];
            const visibleColumn = children.visible[visibleColumnIndex];

            if (visibleColumn?.children == null)
                throw new Error('Invalid visible column path');

            if (visibleColumn.index !== columnIndex)
                throw new Error('Incompatible column group');

            children = { all: column.children, visible: visibleColumn.children };
        }

        return children;
    }

    #getVisibleLeafColumnIndex(column: VisibleColumn): number {
        let index = 0;
        const columnStack = [...this.#controller.state.visibleColumns];
        while (columnStack.length) {
            const current = columnStack.pop()!;
            if (current === column) return index;

            if (!current.children) {
                index++;
                continue;
            }

            for (let i = current.children.length - 1; i >= 0; i--)
                columnStack.push(current.children[i]);
        }

        return -1;
    }

    addColumn = (columnPath: TreePath, visibleColumnPath: TreePath) => {
        const addedColumnSiblings = this.#getAddedColumnSiblings(columnPath, visibleColumnPath);
        const addedColumnIndex = columnPath[visibleColumnPath.length - 1];

        let referenceColumn = addedColumnSiblings.all[addedColumnIndex];
        const addedColumn = this.#createVisibleColumn(addedColumnIndex, referenceColumn);

        let addedChildren = addedColumn.children;
        for (let pathIndex = visibleColumnPath.length; pathIndex < columnPath.length; pathIndex++) {
            const columnIndex = columnPath[pathIndex];

            if (addedChildren == null)
                throw new Error('Column path too long');

            referenceColumn = addedChildren.all[columnIndex];
            const addedColumn = this.#createVisibleColumn(columnIndex, referenceColumn);

            addedChildren.visible.push(addedColumn.column);
            addedChildren = addedColumn.children;
        }

        const addedLeafColumns = addedChildren != null
            ? this.#makeAllChildrenVisible(addedChildren)
            : [referenceColumn];

        const addedVisibleColumnIndex = visibleColumnPath[visibleColumnPath.length - 1];
        addedColumnSiblings.visible.splice(addedVisibleColumnIndex, 0, addedColumn.column);

        const addedLeafPosition = this.#getVisibleLeafColumnIndex(addedColumn.column);
        for (let o = 0; o < addedLeafColumns.length; o++) {
            this.#controller.commands.addColumn.notify({
                column: addedLeafColumns[o],
                index: addedLeafPosition + o
            });
        }

        this.#controller.commands.updateHeader.notify({});

        return this.#controller.actionCreators.removeColumn(visibleColumnPath);
    };

    removeColumn = (visiblePath: TreePath) => {

        
    };
}

export type ActionTypes<TRow, TFilter> =
    keyof ActionHandlers<TRow, TFilter>;

export type ActionArgs<TRow, TFilter, TType extends ActionTypes<TRow, TFilter>> =
    Parameters<ActionHandlers<TRow, TFilter>[TType]>;

export type Action<TRow, TFilter, TType extends ActionTypes<TRow, TFilter>> =
    { type: TType, args: ActionArgs<TRow, TFilter, TType> }

export type ActionCreator<TRow, TFilter, TType extends ActionTypes<TRow, TFilter>> =
    (...args: ActionArgs<TRow, TFilter, TType>) => Action<TRow, TFilter, TType>;

export type ActionDispatcher<TRow, TFilter, TType extends ActionTypes<TRow, TFilter>> =
    (...args: ActionArgs<TRow, TFilter, TType>) => void;

export type ActionCreators<TRow, TFilter> = {
    [TType in ActionTypes<TRow, TFilter>]: ActionCreator<TRow, TFilter, TType>;
};

export type ActionDispatchers<TRow, TFilter> = {
    [TType in ActionTypes<TRow, TFilter>]: ActionDispatcher<TRow, TFilter, TType>;
};