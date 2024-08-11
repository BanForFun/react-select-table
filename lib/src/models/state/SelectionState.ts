import { Config, TableData } from '../../utils/configUtils';
import RowState from './RowState';
import JobBatch from '../JobBatch';

export default class SelectionState<TData extends TableData> {
    constructor(
        private _config: Config<TData>,
        private _jobBatch: JobBatch,
        private _rowState: RowState<TData>
    ) {

    }


}