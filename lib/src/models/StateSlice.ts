import { deepFreeze } from '../utils/objectUtils';
import { OptionalIfPartial } from '../utils/typeUtils';
import { TableData } from '../utils/configUtils';
import type State from './state';

export const dependenciesSymbol = Symbol('dependencies');

export default abstract class StateSlice<
    TData extends TableData = TableData,
    TState extends Partial<State<TData>> = object,
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