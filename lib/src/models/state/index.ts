import HistorySlice from './HistorySlice';
import HeaderSlice from './HeaderSlice';
import RowSlice from './RowSlice';
import { TableData } from '../../utils/configUtils';
import SchedulerSlice from './SchedulerSlice';
import SortOrderSlice from './SortOrderSlice';
import HeaderSizeSlice from './HeaderSizeSlice';
import VisibleRowSlice from './VisibleRowSlice';
import SelectionSlice from './SelectionSlice';
import PageSlice from './PageSlice';
import FilterSlice from './FilterSlice';
import StateSlice from '../StateSlice';
import { Dependencies } from '../Dependent';
import { PartialByValue } from '../../utils/types';

export default class State<TData extends TableData, TShared extends SliceKeys = never> {
    scheduler: SchedulerSlice;
    headers: HeaderSlice<TData>;
    sortOrder: SortOrderSlice<TData>;
    headerSizes: HeaderSizeSlice<TData>;
    history: HistorySlice<TData>;
    visibleRows: VisibleRowSlice<TData>;
    selection: SelectionSlice<TData>;
    page: PageSlice;
    filter: FilterSlice<TData>;
    rows: RowSlice<TData>;

    constructor(config: SharedConfig<TData, TShared>) {
        const getSlice = <TKey extends SliceKeys>(
            key: TKey,
            createSlice: (config: State<TData>[TKey]['config']) => State<TData>[TKey]
        ): State<TData>[TKey] => {
            const configValue = config[key] as ConfigValue<State<TData>[TKey]>;
            if (!(configValue instanceof StateSlice))
                return createSlice(configValue);

            configValue.assertCompatible(this);
            return configValue;
        };

        this.scheduler = getSlice('scheduler', c => new SchedulerSlice(c, {}));

        this.history = getSlice('history', c => new HistorySlice(c, {}));

        this.page = getSlice('page', c => new PageSlice(c, {}));

        this.filter = getSlice('filter', c => new FilterSlice(c, {}));

        this.sortOrder = getSlice('sortOrder', c => new SortOrderSlice(c, {
            scheduler: this.scheduler
        }));

        this.headers = getSlice('headers', c => new HeaderSlice(c, {
            scheduler: this.scheduler
        }));

        this.headerSizes = getSlice('headerSizes', c => new HeaderSizeSlice(c, {
            headers: this.headers
        }));

        this.rows = getSlice('rows', c => new RowSlice(c, {
            scheduler: this.scheduler,
            sortOrder: this.sortOrder
        }));

        this.selection = getSlice('selection', c => new SelectionSlice(c, {
            rows: this.rows
        }));

        this.visibleRows = getSlice('visibleRows', c => new VisibleRowSlice(c, {
            scheduler: this.scheduler,
            page: this.page,
            rows: this.rows,
            filter: this.filter
        }));
    }
}

export type SliceKeys = keyof State<TableData>;

type ConfigValue<TSlice extends StateSlice> = TSlice | TSlice['config'];

type Config<TData extends TableData> = {
    [K in SliceKeys]: State<TData>[K]['config']
}

type DependencyKeys<TName extends SliceKeys> = keyof Dependencies<State<TableData>[TName]> & SliceKeys;

type SubDependencyKeys = {
    [K in SliceKeys]: K | SubDependencyKeys[DependencyKeys<K>]
};

export type SharedConfig<TData extends TableData, TShared extends SliceKeys> = PartialByValue<{
    [K in SliceKeys]: K extends SubDependencyKeys[TShared] ? State<TData>[K & SliceKeys] : Config<TData>[K]
}>