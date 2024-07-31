import { Config, ConfigOverride, parseConfigOverride } from '../utils/configUtils';
import Commands from './Commands';
import createState, { State } from './State';
import ActionHandlers, {
    Action,
    ActionCreator, ActionCreators,
    ActionDispatcher, ActionDispatchers,
    ActionTypes
} from './Actions';
import { mapMethods } from '../utils/objectUtils';

export const actionCreatorsSymbol = Symbol('actionCreators');
export const commandsSymbol = Symbol('commands');

// Public
export default class Controller<TRow, TFilter> {
    readonly #actionHandlers: ActionHandlers<TRow, TFilter>;
    readonly [commandsSymbol]: Commands<TRow>;
    readonly [actionCreatorsSymbol]: ActionCreators<TRow, TFilter>;
    readonly config: Config<TRow, TFilter>;
    readonly state: State<TRow, TFilter>;
    readonly actions: ActionDispatchers<TRow, TFilter>;

    constructor(configOverride: ConfigOverride<TRow, TFilter>) {
        this.#actionHandlers = new ActionHandlers<TRow, TFilter>(this);
        this[commandsSymbol] = new Commands<TRow>();
        this[actionCreatorsSymbol] = mapMethods(this.#actionHandlers, this.#actionCreator);
        this.actions = mapMethods(this.#actionHandlers, this.#actionDispatcher);
        this.config = parseConfigOverride(configOverride);
        this.state = createState(this);
    }

    #actionCreator = <TType extends ActionTypes<TRow, TFilter>>(type: TType): ActionCreator<TRow, TFilter, TType> => {
        return (...args) => ({ type, args });
    };

    #actionDispatcher = <TType extends ActionTypes<TRow, TFilter>>(type: TType): ActionDispatcher<TRow, TFilter, TType> => {
        return (...args) => this.#dispatch(this[actionCreatorsSymbol][type](...args));
    };

    #dispatch = <TType extends ActionTypes<TRow, TFilter>>(action: Action<TRow, TFilter, TType>) => {
        const handler = this.#actionHandlers[action.type] as (...a: typeof action.args) =>
            ReturnType<ActionHandlers<TRow, TFilter>[ActionTypes<TRow, TFilter>]>;

        const undoAction = handler(...action.args);
        if (undoAction == null) return;

        this.state.history.pushAction({
            redo: action,
            undo: undoAction
        });
    };
}