import { deepFreeze } from '../utils/objectUtils';
import { OptionalIfPartial } from '../utils/types';

export const sliceKeys = [
    'columns',
    'scheduler',
    'headers',
    'sortOrder',
    'headerSizes',
    'history',
    'visibleRows',
    'selection',
    'pageSize',
    'filter',
    'rows'
] as const;

export type SliceKeys = typeof sliceKeys[number];

export type Slices = Record<SliceKeys, StateSlice>;

export const dependenciesSymbol = Symbol('dependencies');

export default abstract class StateSlice<
    TState extends Partial<Slices> = object,
    TConf extends object = object
> {
    [dependenciesSymbol]: TState;

    protected get _state() {
        return this[dependenciesSymbol];
    }

    constructor(public config: OptionalIfPartial<TConf>, state: TState) {
        this[dependenciesSymbol] = state;
        deepFreeze(config);
    }
}