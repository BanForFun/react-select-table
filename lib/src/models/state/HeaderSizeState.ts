import { Config, TableData } from '../../utils/configUtils';
import JobBatch from '../JobBatch';
import HeaderState from './HeaderState';

export default class HeaderSizeState<TData extends TableData> {
    #sizes: Record<number, number> = {};

    constructor(
        private _config: Config<TData>,
        private _jobBatch: JobBatch,
        private _headerState: HeaderState<TData>
    ) {

    }


}