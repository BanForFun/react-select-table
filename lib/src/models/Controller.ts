import { Config, ConfigOverride, parseConfigOverride } from '../utils/configUtils';
import Commands from './Commands';
import State from './State';
import ActionHandlers, {
    ActionCreator, ActionCreators,
    ActionDispatcher, ActionDispatchers,
    ActionTypes
} from './Actions';
import { mapMethods } from '../utils/objectUtils';

// Public
export default class Controller<TRow, TFilter> {
    config: Config<TRow, TFilter>;
    commands: Commands<TRow, TFilter>;
    state: State<TRow, TFilter>;
    actions: ActionDispatchers<TRow, TFilter>;
    actionCreators: ActionCreators<TRow, TFilter>;
    actionHandlers: ActionHandlers<TRow, TFilter>;

    constructor(configOverride: ConfigOverride<TRow, TFilter>) {
        this.actionHandlers = new ActionHandlers<TRow, TFilter>(this);
        this.actionCreators = mapMethods(this.actionHandlers, this.#actionCreator) as ActionCreators<TRow, TFilter>;
        this.actions = mapMethods(this.actionHandlers, this.#actionDispatcher) as ActionDispatchers<TRow, TFilter>;
        this.config = parseConfigOverride(configOverride);
        this.commands = new Commands<TRow, TFilter>();
        this.state = new State<TRow, TFilter>();
    }

    #actionCreator = <TType extends ActionTypes<TRow, TFilter>>(type: TType): ActionCreator<TRow, TFilter, TType> => {
        return (...args) => ({ type, args });
    };

    #actionDispatcher = <TType extends ActionTypes<TRow, TFilter>>(type: TType): ActionDispatcher<TRow, TFilter, TType> => {
        const self = this;
        return (...args) => {
            const handler = self.actionHandlers[type] as (...a: typeof args) =>
                ReturnType<ActionHandlers<TRow, TFilter>[ActionTypes<TRow, TFilter>]>;

            const undoAction = handler(...args);
            if (undoAction == null) return;

            self.state.future = [];
            self.state.past.push({
                redo: self.actionCreators[type](...args),
                undo: undoAction
            });
        };
    };

}