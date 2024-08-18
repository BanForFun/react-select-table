import StateSlice from '../StateSlice';
import { log } from '../../utils/debugUtils';

export type Action = {
    type: string,
    args: unknown[]
}

type ActionGroup = Action[];

export type ToUndoCallback = (action: Action) => void
export type Handler<TArgs extends unknown[], TReturn> = (toUndo: ToUndoCallback) => (...args: TArgs) => TReturn;
export type Creator<TArgs extends unknown[]> = (...args: TArgs) => Action;
export type Dispatcher<TArgs extends unknown[], TReturn> = ((...args: TArgs) => TReturn) & { action: Creator<TArgs> };

export default class HistorySlice extends StateSlice {
    readonly #dispatchers: Record<string, (...args: unknown[]) => void> = {};
    #currentGroup: ActionGroup | null = null;
    #past: ActionGroup[] = [];
    #future: ActionGroup[] = [];

    #pop(source: ActionGroup[], dest: ActionGroup[]) {
        const group = source.pop();
        if (!group) return;

        const undoGroup = this.#group(() => {
            for (const action of group) {
                const dispatcher = this.#dispatchers[action.type];
                dispatcher(...action.args);
            }
        });

        dest.push(undoGroup);
    }

    #push(group: ActionGroup) {
        if (group.length === 0) {
            log('Discarding empty undo group');
            return;
        }

        this.#past.push(group);
        this.#future = [];
    }

    #group(callback: () => void): ActionGroup {
        if (this.#currentGroup != null)
            throw new Error('Recursive groups not allowed');

        const group = (this.#currentGroup = []);
        callback();
        this.#currentGroup = null;

        return group;
    }

    _createDispatcher<TArgs extends unknown[], TReturn>(
        type: string,
        handler: Handler<TArgs, TReturn>
    ): Dispatcher<TArgs, TReturn> {
        const dispatcher = (...args: TArgs) => {
            const isRoot = this.#currentGroup == null;

            const group = (this.#currentGroup ??= []);
            const result = handler(action => group.push(action))(...args);

            if (isRoot) {
                this.#push(group);
                this.#currentGroup = null;
            }

            return result;
        };

        dispatcher.action = (...args: TArgs) => ({ type, args });
        this.#dispatchers[type] = (...args) => dispatcher(...args as TArgs);

        return dispatcher;
    }

    group(callback: () => void): void {
        const group = this.#group(callback);
        this.#push(group);
    }

    clear() {
        this.#past = [];
        this.#future = [];
    }

    undo() {
        this.#pop(this.#past, this.#future);
    }

    redo() {
        this.#pop(this.#future, this.#past);
    }
}