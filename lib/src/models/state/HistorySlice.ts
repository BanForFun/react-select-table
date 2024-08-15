import { Action } from '../Actions';
import { TableData } from '../../utils/configUtils';
import StateSlice from '../StateSlice';

type ActionGroup<TData extends TableData> = Action<TData> | ActionGroup<TData>[];

type PopCallback<TData extends TableData> = (action: ActionGroup<TData>) => ActionGroup<TData> | void;

export default class HistorySlice<TData extends TableData> extends StateSlice<undefined> {
    readonly #past: ActionGroup<TData>[] = [];
    #future: ActionGroup<TData>[] = [];

    push(action: ActionGroup<TData>) {
        this.#past.push(action);
        this.#future = [];
    }

    #pop(source: ActionGroup<TData>[], dest: ActionGroup<TData>[], callback: PopCallback<TData>) {
        const action = source.pop();
        if (!action) return;

        const inverse = callback(action);
        if (!inverse) return;

        dest.push(inverse);
    }

    popPast(callback: PopCallback<TData>) {
        this.#pop(this.#past, this.#future, callback);
    }

    popFuture(callback: PopCallback<TData>) {
        this.#pop(this.#future, this.#past, callback);
    }
}