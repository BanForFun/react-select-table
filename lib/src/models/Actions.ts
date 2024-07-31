import { TreePath } from '../utils/unrootedTreeUtils';
import { Controller } from '../index';
import { actionCreatorsSymbol, commandsSymbol } from './Controller';


export default class ActionHandlers<TRow, TFilter> {
    readonly #controller: Controller<TRow, TFilter>;

    constructor(controller: Controller<TRow, TFilter>) {
        this.#controller = controller;
    }

    get #state() {
        return this.#controller.state;
    }

    get #commands() {
        return this.#controller[commandsSymbol];
    }

    get #actionCreators() {
        return this.#controller[actionCreatorsSymbol];
    }

    addColumn = (columnPath: TreePath, visibleColumnPath: TreePath) => {
        const update = this.#state.visibleColumns.addColumn(columnPath, visibleColumnPath);

        this.#commands.updateHeader.notify({
            addedColumns: update.addedLeafColumns,
            addedPosition: update.addedLeafPosition
        });

        return this.#actionCreators.removeColumn(visibleColumnPath);
    };


    removeColumn = (visiblePath: TreePath) => {


    };
}

export type ActionTypes<TRow, TFilter> =
    keyof ActionHandlers<TRow, TFilter>;

export type ActionArgs<TRow, TFilter, TType extends ActionTypes<TRow, TFilter>> =
    Parameters<ActionHandlers<TRow, TFilter>[TType]>;

export type Action<TRow, TFilter, TType extends ActionTypes<TRow, TFilter>> =
    { type: TType, args: ActionArgs<TRow, TFilter, TType> }

export type ActionCreator<TRow, TFilter, TType extends ActionTypes<TRow, TFilter>> =
    (...args: ActionArgs<TRow, TFilter, TType>) => Action<TRow, TFilter, any>;

export type ActionDispatcher<TRow, TFilter, TType extends ActionTypes<TRow, TFilter>> =
    (...args: ActionArgs<TRow, TFilter, TType>) => void;

export type ActionCreators<TRow, TFilter> = {
    [TType in ActionTypes<TRow, TFilter>]: ActionCreator<TRow, TFilter, TType>;
};

export type ActionDispatchers<TRow, TFilter> = {
    [TType in ActionTypes<TRow, TFilter>]: ActionDispatcher<TRow, TFilter, TType>;
};