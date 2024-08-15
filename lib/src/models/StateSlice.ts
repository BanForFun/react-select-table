import { assignDefaults, deepFreeze } from '../utils/objectUtils';

export const sliceKeys = [
    'scheduler',
    'headers',
    'sortOrder',
    'headerSizes',
    'history',
    'visibleRows',
    'selection',
    'page',
    'filter',
    'rows'
] as const;

export type SliceKeys = typeof sliceKeys[number];

export type Slices = Record<SliceKeys, StateSlice>;

export const dependenciesSymbol = Symbol('dependencies');

export default abstract class StateSlice<
    TConf extends object | undefined = object | undefined,
    TState extends Partial<Slices> = object,
> {
    [dependenciesSymbol]: TState;

    protected get _state() {
        return this[dependenciesSymbol];
    }

    constructor(public config: TConf, state: TState) {
        this[dependenciesSymbol] = state;
        deepFreeze(config);

        this._init();
    }

    protected _init() {

    };
}

export abstract class PartialConfigStateSlice<
    TConf extends object = object,
    TState extends Partial<Slices> = object,
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