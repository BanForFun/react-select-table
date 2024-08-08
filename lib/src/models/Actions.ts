import { TreePath } from '../utils/unrootedTreeUtils';
import State from './State';
import { TableData } from '../utils/configUtils';
import { mapMethods } from '../utils/objectUtils';
import { NewSortOrder } from './ColumnState';

export default class ActionHandlers<TData extends TableData> {
    readonly #creators: ActionCreators<TData>;
    readonly #dispatchers: ActionDispatchers<TData>;

    private constructor(private _state: State<TData>) {
        const handlers = this as ActionHandlers<TData>;
        this.#creators = mapMethods(handlers, this.#actionCreator);
        this.#dispatchers = mapMethods(handlers, this.#actionDispatcher);
    }

    static createActionDispatchers<TData extends TableData>(state: State<TData>) {
        return new ActionHandlers(state).#dispatchers;
    }

    #actionCreator = <TType extends ActionTypes<TData>>(type: TType): ActionCreator<TData, TType> => {
        return (...args) => ({ type, args });
    };

    #actionDispatcher = <TType extends ActionTypes<TData>>(type: TType): ActionDispatcher<TData, TType> => {
        return (...args) => this.#dispatch(this.#creators[type](...args));
    };

    #dispatch = <TType extends ActionTypes<TData>>(action: Action<TData, TType>) => {
        const handler = this[action.type] as ActionHandler<TData, TType>;
        const undoAction = handler(...action.args);
        if (undoAction)
            this._state.history.pushAction(undoAction);
    };

    addColumn = (columnPath: TreePath, headerPath: TreePath) => {
        this._state.columns.addHeader(columnPath, headerPath);
    };

    sortByColumn = (path: TreePath, newOrder: NewSortOrder, append: boolean) => {
        const oldOrder = this._state.columns.sortByColumn(path, newOrder, append);
        return this.#creators.sortByColumn(path, oldOrder, false);
    };

    sortByHeader = (path: TreePath, newOrder: NewSortOrder, append: boolean) => {
        const oldOrder = this._state.columns.sortByHeader(path, newOrder, append);
        return this.#creators.sortByHeader(path, oldOrder, false);
    };
}

export type ActionTypes<TData extends TableData> =
    keyof ActionHandlers<TData>;

export type ActionArgs<TData extends TableData, TType extends ActionTypes<TData>> =
    Parameters<ActionHandlers<TData>[TType]>;

export type Action<TData extends TableData, TType extends ActionTypes<TData> = ActionTypes<TData>> =
    { type: TType, args: ActionArgs<TData, TType> }

type ActionHandler<TData extends TableData, TType extends ActionTypes<TData>> =
    (...args: ActionArgs<TData, TType>) => ReturnType<ActionHandlers<TData>[ActionTypes<TData>]>

export type ActionCreator<TData extends TableData, TType extends ActionTypes<TData>> =
    (...args: ActionArgs<TData, TType>) => Action<TData>;

export type ActionDispatcher<TData extends TableData, TType extends ActionTypes<TData>> =
    (...args: ActionArgs<TData, TType>) => void;

export type ActionCreators<TData extends TableData> = {
    [TType in ActionTypes<TData>]: ActionCreator<TData, TType>;
};

export type ActionDispatchers<TData extends TableData> = {
    [TType in ActionTypes<TData>]: ActionDispatcher<TData, TType>;
};