import { Action, ActionTypes } from './Actions';

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

export type UndoableAction<TRow, TFilter> = {
    redo: Action<TRow, TFilter, ActionTypes<TRow, TFilter>>;
    undo: Action<TRow, TFilter, ActionTypes<TRow, TFilter>>;
}

export default class State<TRow, TFilter> {
    visibleColumns: VisibleColumn[] = [];
    past: UndoableAction<TRow, TFilter>[] = [];
    future: UndoableAction<TRow, TFilter>[] = [];
}