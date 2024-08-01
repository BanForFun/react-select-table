import { Controller } from '../index';
import { Column } from '../utils/columnUtils';
import { TreePath } from '../utils/unrootedTreeUtils';
import { commandsSymbol } from './Controller';

interface BaseVisibleColumnRef {
    index: number;
    id: number;
}

interface ParentVisibleColumnRef extends BaseVisibleColumnRef {
    children: VisibleColumnRef[];
}

interface LeafVisibleColumnRef extends BaseVisibleColumnRef {
    width: number;
    children?: never;
}

export type VisibleColumnRef = LeafVisibleColumnRef | ParentVisibleColumnRef;

interface ColumnChildren<TRow> {
    readonly all: Column<TRow>[];
    readonly visible: VisibleColumnRef[];
}

export interface VisibleColumn<TRow> {
    info: Column<TRow>;
    id: number;
    visibleChildren: VisibleColumnIterator<TRow> | null;
}

type VisibleColumnIterator<TRow> = Generator<VisibleColumn<TRow>>

let lastId = 0;

export default class VisibleColumnsSlice<TRow, TFilter> {
    readonly #controller: Controller<TRow, TFilter>;
    readonly #rootChildren: ColumnChildren<TRow>;

    private visibleColumns: VisibleColumnRef[] = [];

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

    * #visibleColumnIterator(columns: ColumnChildren<TRow>, rightToLeft: boolean): VisibleColumnIterator<TRow> {
        const getVisibleColumn = (index: number): VisibleColumn<TRow> => {
            const visibleColumn = columns.visible[index];
            const column = columns.all[visibleColumn.index];
            if (!column) throw new Error('Invalid referenced column');

            return {
                id: visibleColumn.id,
                info: column,
                visibleChildren: visibleColumn.children ? this.#visibleColumnIterator({
                    all: column.children!,
                    visible: visibleColumn.children
                }, rightToLeft) : null
            };
        };

        if (rightToLeft)
            for (let i = columns.visible.length - 1; i >= 0; i--) yield getVisibleColumn(i);
        else
            for (let i = 0; i < columns.visible.length; i++) yield getVisibleColumn(i);
    }

    #createVisibleColumn(index: number, from: Column<TRow>): {
        column: VisibleColumnRef,
        children: ColumnChildren<TRow> | null
    } {
        if (from == null)
            throw new Error('Invalid reference column');

        if (from.children == null) return {
            column: { index, id: ++lastId, width: this.#config.defaultColumnWidthPc },
            children: null
        };

        const children: VisibleColumnRef[] = [];
        return {
            column: { index, id: ++lastId, children: children },
            children: {
                all: from.children,
                visible: children
            }
        };
    }

    #makeAllChildrenVisible(children: ColumnChildren<TRow>): Column<TRow>[] {
        const addedLeafColumns: Column<TRow>[] = [];
        const childrenStack: ColumnChildren<TRow>[] = [children];
        while (childrenStack.length) {
            const children = childrenStack.pop()!;
            for (let i = 0; i < children.all.length; i++) {
                const referenceColumn = children.all[i];
                const addedColumn = this.#createVisibleColumn(i, referenceColumn);
                children.visible.push(addedColumn.column);

                if (addedColumn.children == null) {
                    addedLeafColumns.push(referenceColumn);
                    continue;
                }

                childrenStack.push(addedColumn.children);
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

    #getVisibleLeafColumnIndex(column: VisibleColumnRef): number {
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

    iterator(rightToLeft: boolean = false) {
        return this.#visibleColumnIterator(this.#rootChildren, rightToLeft);
    }
}