import StateSlice from '../StateSlice';

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

        if (this.#currentGroup != null)
            throw new Error('Recursive undo or redo detected');

        this.#currentGroup = [];

        for (const action of group) {
            const dispatcher = this.#dispatchers[action.type];
            dispatcher(...action.args);
        }

        dest.push(this.#currentGroup);

        this.#currentGroup = null;
    }

    createDispatcher<TArgs extends unknown[], TReturn>(
        type: string,
        handler: Handler<TArgs, TReturn>
    ): Dispatcher<TArgs, TReturn> {
        const dispatcher = (...args: TArgs) => {
            const isRoot = this.#currentGroup == null;

            const group = (this.#currentGroup ??= []);
            const result = handler(action => group.push(action))(...args);

            if (isRoot) {
                this.#past.push(this.#currentGroup);
                this.#future = [];

                this.#currentGroup = null;
            }

            return result;
        };

        this.#dispatchers[type] = (...args) => dispatcher(...args as TArgs);

        dispatcher.action = (...args: TArgs) => ({ type, args });
        return dispatcher;
    }

    undo() {
        this.#pop(this.#past, this.#future);
    }

    redo() {
        this.#pop(this.#future, this.#past);
    }
}