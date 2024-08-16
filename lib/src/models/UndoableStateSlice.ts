import StateSlice, { Slices } from './StateSlice';
import HistorySlice, { Handler } from './state/HistorySlice';

export default abstract class UndoableStateSlice<
    TState extends Partial<Slices> = object,
    TConf extends object = object
> extends StateSlice<TState & { history: HistorySlice }, TConf> {
    protected abstract readonly _sliceKey: string;

    protected _dispatcher<TArgs extends unknown[], TReturn>(key: string, handler: Handler<TArgs, TReturn>) {
        const type = `${this._sliceKey}/${key}`;
        return this._state.history.createDispatcher(type, handler);
    }
}