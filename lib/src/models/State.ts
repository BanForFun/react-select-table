import HistoryState from './HistoryState';
import ColumnState from './ColumnState';
import RowState from './RowState';
import { Config, TableData } from '../utils/configUtils';

export default class State<TData extends TableData> {
    columns: ColumnState<TData>;
    history: HistoryState<TData>;
    rows: RowState<TData>;

    constructor(config: Config<TData>) {
        this.columns = new ColumnState(config);
        this.history = new HistoryState<TData>();
        this.rows = new RowState(config, this.columns);
    }
}