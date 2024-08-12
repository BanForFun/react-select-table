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

    constructor(config: Config<TData>, scheduler: JobScheduler) {
        this.history = new HistoryState();
        this.sortOrder = new SortOrderState(config, scheduler);
        this.headers = new HeaderState(config, scheduler);
        this.page = new PageState(config, scheduler);
        this.filter = new FilterState(config, scheduler);
        this.headerSizes = new HeaderSizeState(config, scheduler, {
            headers: this.headers
        });
        this.rows = new RowState(config, scheduler, {
            sortOrder: this.sortOrder
        });
        this.selection = new SelectionState(config, scheduler, {
            rows: this.rows
        });
        this.visibleRows = new VisibleRowState(config, scheduler, {
            page: this.page,
            rows: this.rows,
            filter: this.filter
        });
    }
}