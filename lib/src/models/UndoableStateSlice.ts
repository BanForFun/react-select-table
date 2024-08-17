import StateSlice, { Slices } from './StateSlice';
import HistorySlice, { Handler } from './state/HistorySlice';

interface RequiredState {
    history: HistorySlice;
}

export default abstract class UndoableStateSlice<
    TState extends Partial<Slices> & RequiredState = RequiredState,
    TConf extends object = object
> extends StateSlice<TState, TConf> {
    protected abstract readonly _sliceKey: string;

    protected _dispatcher<TArgs extends unknown[], TReturn>(key: string, handler: Handler<TArgs, TReturn>) {
        const type = `${this._sliceKey}/${key}`;
        return this._state.history._createDispatcher(type, handler);
    }
}