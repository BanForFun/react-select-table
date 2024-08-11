import { Action } from '../Actions';
import { TableData } from '../../utils/configUtils';

type PopCallback<TData extends TableData> = (action: Action<TData>) => Action<TData> | void;

export default class HistoryState<TData extends TableData> {
    readonly #past: Action<TData>[] = [];
    #future: Action<TData>[] = [];

    pushAction(action: Action<TData>) {
        this.#past.push(action);
        this.#future = [];
    }

    #pop(source: Action<TData>[], dest: Action<TData>[], callback: PopCallback<TData>) {
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