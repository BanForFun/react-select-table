import {
    Config, ConfigOverride, defaultConfig,
    TableData
} from '../utils/configUtils';
import State from './state';
import ActionHandlers, { ActionDispatchers } from './Actions';
import { assignDefaults, deepFreeze } from '../utils/objectUtils';
import JobScheduler from './JobScheduler';
import { MaybePromise } from '../utils/types';

export default class Controller<TData extends TableData> {
    #scheduler: JobScheduler = new JobScheduler();

    readonly config: Config<TData>;
    readonly state: State<TData>;
    readonly actions: ActionDispatchers<TData>;

    constructor(config: Config<TData>) {
        this.config = config;
        this.state = new State(this.config, this.#scheduler);
        this.actions = ActionHandlers.createActionDispatchers(this.state);
    }

    batchActions(callback: (actions: ActionDispatchers<TData>) => MaybePromise<void>) {
        return this.#scheduler.batch(() => callback(this.actions));
    }

    syncActions(callback: (actions: ActionDispatchers<TData>) => MaybePromise<void>) {
        return this.#scheduler.sync(() => callback(this.actions));
    }

    asyncActions(callback: (actions: ActionDispatchers<TData>) => MaybePromise<void>) {
        return this.#scheduler.async(() => callback(this.actions));
    }
}

// Public
export function createController<
    TRow extends object,
    TError extends NonNullable<unknown> = never,
    TFilter extends NonNullable<unknown> = never
>(override: ConfigOverride<TableData<TRow, TError, TFilter>>) {
    const config = deepFreeze(assignDefaults(override, defaultConfig));
    return new Controller<TableData<TRow, TError, TFilter>>(config);
}