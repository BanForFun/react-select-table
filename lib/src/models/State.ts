import HistoryState from './HistoryState';
import ColumnState from './ColumnState';
import RowState from './RowState';
import { Config, TableData } from '../utils/configUtils';
import JobBatch from './JobBatch';

export default class State<TData extends TableData> {
    columns: ColumnState<TData>;
    history: HistoryState<TData>;
    rows: RowState<TData>;

    constructor(config: Config<TData>, jobBatch: JobBatch) {
        this.columns = new ColumnState(config, jobBatch);
        this.history = new HistoryState<TData>();
        this.rows = new RowState(config, jobBatch, this.columns);
    }
}