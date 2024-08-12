import { Config, TableData } from '../../utils/configUtils';
import RowState from './RowState';
import JobScheduler from '../JobScheduler';

export default class SelectionState<TData extends TableData> {
    constructor(
        private _config: Config<TData>,
        private _scheduler: JobScheduler,
        private _rowState: RowState<TData>
    ) {

    }


}