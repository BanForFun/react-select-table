import { TableData } from '../utils/configUtils';
import State, { SharedConfig } from './state';
import ActionHandlers, { ActionDispatchers } from './Actions';
import { SliceKeys } from './StateSlice';

export default class Controller<TData extends TableData> {
    readonly actions: ActionDispatchers<TData>;

    constructor(public readonly state: State<TData>) {
        this.actions = ActionHandlers.createActionDispatchers(this.state);
    }
}

// Public
export function createController<
    TRow extends object,
    TError extends NonNullable<unknown> = never,
    TFilter extends NonNullable<unknown> = never
>(config: SharedConfig<TableData<TRow, TError, TFilter>, never>) {
    return new Controller(new State(config));
}

// Public
export function createSharedController<
    TShared extends SliceKeys,
    TRow extends object,
    TError extends NonNullable<unknown> = never,
    TFilter extends NonNullable<unknown> = never
>(config: SharedConfig<TableData<TRow, TError, TFilter>, TShared>) {
    return new Controller(new State(config));
}