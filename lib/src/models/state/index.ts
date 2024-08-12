import HistoryState from './HistoryState';
import HeaderState from './HeaderState';
import RowState from './RowState';
import { Config, TableData } from '../../utils/configUtils';
import JobScheduler from '../JobScheduler';
import SortOrderState from './SortOrderState';
import HeaderSizeState from './HeaderSizeState';
import VisibleRowState from './VisibleRowState';
import SelectionState from './SelectionState';
import PageState from './PageState';
import FilterState from './FilterState';

export default class State<TData extends TableData> {
    headers: HeaderState<TData>;
    sortOrder: SortOrderState<TData>;
    headerSizes: HeaderSizeState<TData>;
    history: HistoryState<TData>;
    visibleRows: VisibleRowState<TData>;
    selection: SelectionState<TData>;
    page: PageState<TData>;
    filter: FilterState<TData>;
    rows: RowState<TData>;

    constructor(config: Config<TData>, jobBatch: JobScheduler) {
        this.sortOrder = new SortOrderState(config, jobBatch);
        this.headers = new HeaderState(config, jobBatch);
        this.page = new PageState(config, jobBatch);
        this.filter = new FilterState(config, jobBatch);
        this.headerSizes = new HeaderSizeState(config, jobBatch, this.headers);
        this.rows = new RowState(config, jobBatch, this.sortOrder);
        this.selection = new SelectionState(config, jobBatch, this.rows);
        this.visibleRows = new VisibleRowState(config, jobBatch, this.page, this.filter, this.rows);
        this.history = new HistoryState();
    }
}