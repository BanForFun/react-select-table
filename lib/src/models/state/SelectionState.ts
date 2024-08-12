import { Config, TableData } from '../../utils/configUtils';
import RowState from './RowState';
import JobScheduler from '../JobScheduler';
import Dependent from '../Dependent';

interface Dependencies<TData extends TableData> {
    rows: RowState<TData>;
}

export default class SelectionState<TData extends TableData> extends Dependent<Dependencies<TData>> {
    constructor(
        private _config: Config<TData>,
        private _scheduler: JobScheduler,
        private _state: Dependencies<TData>
    ) {
        super(_state);
    }


}