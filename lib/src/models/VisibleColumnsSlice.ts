import { Controller } from '../index';
import { Column } from '../utils/columnUtils';
import { TreePath } from '../utils/unrootedTreeUtils';
import { commandsSymbol } from './Controller';

interface BaseVisibleColumn {
    index: number;
}

interface ParentVisibleColumn extends BaseVisibleColumn {
    children: VisibleColumn[];
}

interface LeafVisibleColumn extends BaseVisibleColumn {
    width: number;
    children?: never;
}

export type VisibleColumn = LeafVisibleColumn | ParentVisibleColumn;

interface ColumnChildren<TRow> {
    readonly all: Column<TRow>[];
    readonly visible: VisibleColumn[];
}

type ColumnIterator<TRow> = Generator<{
    column: Column<TRow>,
    children: ColumnIterator<TRow> | null
}>

export default class VisibleColumnsSlice<TRow, TFilter> {
    readonly #controller: Controller<TRow, TFilter>;
    readonly #rootChildren: ColumnChildren<TRow>;

    private visibleColumns: VisibleColumn[] = [];

    constructor(controller: Controller<TRow, TFilter>) {
        this.#controller = controller;
        this.#rootChildren = {
            all: this.#config.columns,
            visible: this.visibleColumns
        };
    }

    get #config() {
        return this.#controller.config;
    }

    get #commands() {
        return this.#controller[commandsSymbol];
    }

    * #columnIterator(columns: ColumnChildren<TRow>): ColumnIterator<TRow> {
        for (let i = 0; i < columns.visible.length; i++) {
            const visibleColumn = columns.visible[i];
            const column = columns.all[visibleColumn.index];
            if (!column) throw new Error('Invalid referenced column');

            yield {
                column,
                children: visibleColumn.children ? this.#columnIterator({
                    all: column.children!,
                    visible: visibleColumn.children
                }) : null
            };
        }
    }

    #createVisibleColumn(index: number, from: Column<TRow>): {
        column: VisibleColumn,
        children: ColumnChildren<TRow> | null
    } {
        if (from == null)
            throw new Error('Invalid reference column');

        if (from.children == null) return {
            column: { index, width: this.#config.defaultColumnWidthPc },
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

        let children = this.#rootChildren;
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
        const columnStack = [...this.visibleColumns];
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

    addColumn(columnPath: TreePath, visibleColumnPath: TreePath) {
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

        this.#commands.updateHeader.notify({
            addedColumns: addedLeafColumns,
            addedPosition: addedLeafPosition
        });
    };

    columnIterator() {
        return this.#columnIterator(this.#rootChildren);
    }
}