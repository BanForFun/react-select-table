import { Action } from './Actions';

type UndoableAction<TRow, TFilter> = {
    redo: Action<TRow, TFilter>;
    undo: Action<TRow, TFilter>;
}

export default class HistoryState<TRow, TFilter> {
    past: UndoableAction<TRow, TFilter>[] = [];
    future: UndoableAction<TRow, TFilter>[] = [];

    pushAction(action: UndoableAction<TRow, TFilter>) {
        this.past.push(action);
        this.future = [];
    }

    popPast() {
        const actions = this.past.pop();
        if (actions)
            this.future.push(actions);

        return actions?.undo;
    }

    popFuture() {
        const actions = this.future.pop();
        if (actions)
            this.past.push(actions);

        return actions?.undo;
    }
}