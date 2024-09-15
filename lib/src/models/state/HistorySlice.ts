import StateSlice from '../StateSlice';
import { log } from '../../utils/debugUtils';
import { ActionCallback } from '../../utils/types';
import SchedulerSlice, { ScheduledFlush } from './SchedulerSlice';

interface Dependencies {
    scheduler: SchedulerSlice;
}

export type Action = {
    type: string,
    args: unknown[]
}

type ActionGroup = Action[];

export type AddUndoAction = (action: Action) => void
export type Handler<TArgs extends unknown[]> = (toUndo: AddUndoAction, ...args: TArgs) => void;
export type Creator<TArgs extends unknown[]> = (...args: TArgs) => Action;
export type Dispatcher<TArgs extends unknown[]> = ((...args: TArgs) => ScheduledFlush) & {
    action: Creator<TArgs>,
    handler: Handler<TArgs>
};

type GroupCallback = (group: ActionGroup) => void;

export default class HistorySlice extends StateSlice<Dependencies> {
    readonly #handlers: Record<string, Handler<unknown[]>> = {};
    #currentGroup: ActionGroup | null = null;
    #past: ActionGroup[] = [];
    #future: ActionGroup[] = [];

    #popGroup(source: ActionGroup[], dest: ActionGroup[]): ScheduledFlush {
        if (this.#currentGroup != null)
            throw new Error('Undo/redo called inside history group');

        return this._state.scheduler.flush(() => {
            const group = source.pop();
            if (!group) return;

            const undoGroup: ActionGroup = [];
            for (const action of group) {
                const handler = this.#handlers[action.type];
                handler(action => undoGroup.push(action), ...action.args);
            }

            dest.push(undoGroup);
        });
    }

    #pushGroup(callback: GroupCallback): ScheduledFlush {
        return this._state.scheduler.flush(() => {
            if (this.#currentGroup != null)
                return callback(this.#currentGroup);

            const group: ActionGroup = [];
            this.#currentGroup = group;
            callback(group);
            this.#currentGroup = null;

            if (group.length === 0) {
                log('Discarding empty undo group');
                return;
            }

            this.#past.push(group);
            this.#future = [];
        });
    }

    _createDispatcher<TArgs extends unknown[]>(type: string, handler: Handler<TArgs>): Dispatcher<TArgs> {
        const dispatcher = (...args: TArgs) => this.#pushGroup(group => {
            // In case we are running inside scheduler.sync
            this._state.scheduler.batch(() => {
                handler(action => group.push(action), ...args);
            });
        });

        dispatcher.action = (...args: TArgs) => ({ type, args });
        dispatcher.handler = handler;

        this.#handlers[type] = (toUndo, ...args) => handler(toUndo, ...args as TArgs);

        return dispatcher;
    }

    group(callback: ActionCallback) {
        return this.#pushGroup(callback);
    }

    clear() {
        if (this.#currentGroup != null)
            throw new Error('Clear called inside history group');

        return this._state.scheduler.flush(() => {
            this.#past = [];
            this.#future = [];
        });
    }

    undo() {
        return this.#popGroup(this.#past, this.#future);
    }

    redo() {
        return this.#popGroup(this.#future, this.#past);
    }
}