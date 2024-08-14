import Dependent from './Dependent';
import { deepFreeze } from '../utils/objectUtils';

export default abstract class StateSlice<
    TConf extends object = object,
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