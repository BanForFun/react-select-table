import { Action } from '../Actions';
import { TableData } from '../../utils/configUtils';
import StateSlice from '../StateSlice';

type PopCallback<TData extends TableData> = (action: Action<TData>) => Action<TData> | void;

export default class HistorySlice<TData extends TableData> extends StateSlice<undefined> {
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