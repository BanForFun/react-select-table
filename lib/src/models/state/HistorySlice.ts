import StateSlice from '../StateSlice';
import { log } from '../../utils/debugUtils';
import { ActionCallback } from '../../utils/types';
import SchedulerSlice from './SchedulerSlice';

interface Dependencies {
    scheduler: SchedulerSlice;
}

export type Action = {
    type: string,
    args: unknown[]
}

type ActionGroup = Action[];

export type AddUndoAction = (action: Action) => void
export type Handler<TArgs extends unknown[], TResult> = (toUndo: AddUndoAction, ...args: TArgs) => TResult;
export type Creator<TArgs extends unknown[]> = (...args: TArgs) => Action;
export type Dispatcher<TArgs extends unknown[], TResult> = ((...args: TArgs) => TResult) & {
    action: Creator<TArgs>,
    handler: Handler<TArgs, TResult>
};

type GroupCallback<T> = (group: ActionGroup) => T;

export default class HistorySlice extends StateSlice<Dependencies> {
    readonly #handlers: Record<string, Handler<unknown[], unknown>> = {};
    #currentGroup: ActionGroup | null = null;
    #past: ActionGroup[] = [];
    #future: ActionGroup[] = [];

    #popGroup(source: ActionGroup[], dest: ActionGroup[]): void {
        if (this.#currentGroup != null)
            throw new Error('Undo/redo called inside history group');

        const group = source.pop();
        if (!group) return;

        const undoGroup: ActionGroup = [];
        for (const action of group) {
            const handler = this.#handlers[action.type];
            handler(action => undoGroup.push(action), ...action.args);
        }

        dest.push(undoGroup);
    }

    #pushGroup<T>(callback: GroupCallback<T>): T {
        if (this.#currentGroup != null)
            return callback(this.#currentGroup);

        const group: ActionGroup = [];
        this.#currentGroup = group;
        const result = callback(group);
        this.#currentGroup = null;

        if (group.length === 0) {
            log('Discarding empty history group');
        } else {
            this.#past.push(group);
            this.#future = [];
        }

        return result;
    }

    _createDispatcher<TArgs extends unknown[], TResult>(type: string, handler: Handler<TArgs, TResult>): Dispatcher<TArgs, TResult> {
        const dispatcher = (...args: TArgs) =>
            this.#pushGroup(group =>
                this._state.scheduler.batch(() =>
                    handler(action => group.push(action), ...args)));

        dispatcher.action = (...args: TArgs) => ({ type, args });
        dispatcher.handler = handler;

        this.#handlers[type] = (toUndo, ...args) => handler(toUndo, ...args as TArgs);

        return dispatcher;
    }

    group(callback: ActionCallback) {
        this.#pushGroup(callback);
    }

    clear() {
        if (this.#currentGroup != null)
            // Future actions inside group would never be recorded
            throw new Error('Clear called inside history group');

        this.#past = [];
        this.#future = [];
    }

    undo() {
        this.#popGroup(this.#past, this.#future);
    }

    redo() {
        this.#popGroup(this.#future, this.#past);
    }
}