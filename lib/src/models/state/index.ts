import HistoryState from './HistoryState';
import HeaderState from './HeaderState';
import RowState from './RowState';
import { Config, TableData } from '../../utils/configUtils';
import JobBatch from '../JobBatch';
import SortOrderState from './SortOrderState';
import HeaderSizeState from './HeaderSizeState';

export default class State<TData extends TableData> {
    headers: HeaderState<TData>;
    sortOrder: SortOrderState<TData>;
    headerSizes: HeaderSizeState<TData>;
    history: HistoryState<TData>;
    rows: RowState<TData>;

    constructor(config: Config<TData>, jobBatch: JobBatch) {
        this.sortOrder = new SortOrderState(config, jobBatch);
        this.headers = new HeaderState(config, jobBatch);
        this.headerSizes = new HeaderSizeState(config, jobBatch, this.headers);
        this.rows = new RowState(config, jobBatch, this.sortOrder);
        this.history = new HistoryState();
    }
}