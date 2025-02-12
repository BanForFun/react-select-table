import StateSlice from './StateSlice';
import HistorySlice, { Handler } from './state/HistorySlice';
import { TableData } from '../utils/configUtils';
import type State from './state';

interface RequiredState {
    history: HistorySlice;
}

export default abstract class UndoableStateSlice<
    TData extends TableData = TableData,
    TState extends Partial<State<TData>> & RequiredState = RequiredState,
    TConf extends object = object
> extends StateSlice<TData, TState, TConf> {
    protected abstract readonly _sliceKey: string;

    protected _dispatcher<TArgs extends unknown[], TResult>(key: string, handler: Handler<TArgs, TResult>) {
        const type = `${this._sliceKey}/${key}`;
        return this._state.history._createDispatcher(type, handler);
    }
}