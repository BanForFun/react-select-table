import Dependent from './Dependent';
import { assignDefaults, deepFreeze } from '../utils/objectUtils';

export default abstract class StateSlice<
    TConf extends object | undefined = object | undefined,
    TState extends object = object,
> extends Dependent<TState> {
    constructor(public config: TConf, protected _state: TState) {
        super(_state);
        deepFreeze(config);

        this._init();
    }

    protected _init() {

    };
}

export abstract class PartialConfigStateSlice<
    TConf extends object = object,
    TState extends object = object,
> extends StateSlice<Partial<TConf> | undefined, TState> {
    protected _config: TConf;

    protected abstract _getDefaultConfig(): TConf;

    constructor(public config: Partial<TConf> | undefined, state: TState) {
        super(undefined, state);
        this._config = deepFreeze(config
            ? assignDefaults(config, this._getDefaultConfig())
            : this._getDefaultConfig());

        this._init();
    }

    protected _init() {

    };
}