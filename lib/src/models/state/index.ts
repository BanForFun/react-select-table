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
import StateSlice, { dependenciesSymbol, sliceKeys, SliceKeys, Slices } from '../StateSlice';
import { Dependencies } from '../Dependent';
import { PartialByValue } from '../../utils/types';
import { assignDefaults } from '../../utils/objectUtils';

export default class State<TData extends TableData, TShared extends SliceKeys = never> implements Slices {
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

    #installDependencies(dependencies: Partial<State<TData>>) {
        for (const name of sliceKeys) {
            const dependency = dependencies[name];
            if (!dependency) continue;

            const installed = this[name];
            if (!installed)
                this.#installDependencies(dependency[dependenciesSymbol]);
            else if (installed !== dependency)
                throw new Error('Incompatible dependencies');
        }

        assignDefaults(this, dependencies);
    }

    constructor(config: SharedConfig<TData, TShared>) {
        for (const name of sliceKeys) {
            if (config[name] instanceof StateSlice)
                this.#installDependencies(config[name][dependenciesSymbol]);
        }

        const getSlice = <TKey extends SliceKeys>(
            key: TKey,
            createSlice: (config: State<TData>[TKey]['config']) => State<TData>[TKey]
        ): State<TData>[TKey] => {
            const configValue = config[key] as ConfigValue<State<TData>[TKey]>;
            return configValue instanceof StateSlice ? configValue : createSlice(configValue);
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

type ConfigValue<TSlice extends StateSlice> = TSlice | TSlice['config'];

type DependencyKeys<TName extends SliceKeys> = keyof Dependencies<State<TableData>[TName]> & SliceKeys;

type SubDependencyKeys = {
    [K in SliceKeys]: DependencyKeys<K> | SubDependencyKeys[DependencyKeys<K>]
};

export type SharedConfig<TData extends TableData, TShared extends SliceKeys> = PartialByValue<{
    [K in SliceKeys]: K extends SubDependencyKeys[TShared] ? undefined :
        K extends TShared ? State<TData>[K] : State<TData>[K]['config']
}>