import {
    Config, ConfigOverride, defaultConfig,
    TableData
} from '../utils/configUtils';
import State from './State';
import ActionHandlers, { ActionDispatchers } from './Actions';
import { assignDefaults, deepFreeze } from '../utils/objectUtils';
import JobBatch from './JobBatch';

export default class Controller<TData extends TableData> {
    #jobBatch: JobBatch = new JobBatch();

    readonly config: Config<TData>;
    readonly state: State<TData>;
    readonly actions: ActionDispatchers<TData>;

    constructor(config: Config<TData>) {
        this.config = config;
        this.state = new State(this.config, this.#jobBatch);
        this.actions = ActionHandlers.createActionDispatchers(this.state);
    }

    batchActions(callback: (actions: ActionDispatchers<TData>) => void) {
        this.#jobBatch.batch(() => callback(this.actions));
    }
}

// Public
export function createController<
    TRow,
    TError extends NonNullable<unknown> = never,
    TFilter extends NonNullable<unknown> = never
>(override: ConfigOverride<TableData<TRow, TError, TFilter>>) {
    const config = deepFreeze(assignDefaults(override, defaultConfig));
    return new Controller<TableData<TRow, TError, TFilter>>(config);
}