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
import { dependenciesSymbol, sliceKeys, SliceKeys, Slices } from '../StateSlice';
import { PartialByValue } from '../../utils/types';
import { assign } from '../../utils/objectUtils';
import ColumnSlice from './ColumnSlice';

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
    columns: ColumnSlice<TData>;

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

        assign(this, dependencies);
    }

    constructor(slices: SharedSlices<TData, TShared>, config: SharedConfig<TData, TShared>) {
        this.#installDependencies(slices);

        this.scheduler ??= new SchedulerSlice(config.scheduler, {});

        this.history ??= new HistorySlice(config.history, {});

        this.page ??= new PageSlice(config.page, {});

        this.filter ??= new FilterSlice(config.filter, {});

        this.columns ??= new ColumnSlice(config.columns!, {});

        this.sortOrder ??= new SortOrderSlice(config.sortOrder, {
            scheduler: this.scheduler,
            columns: this.columns
        });

        this.headers ??= new HeaderSlice(config.headers!, {
            scheduler: this.scheduler,
            columns: this.columns
        });

        this.headerSizes ??= new HeaderSizeSlice(config.headerSizes!, {
            headers: this.headers
        });

        this.rows ??= new RowSlice(config.rows!, {
            scheduler: this.scheduler,
            sortOrder: this.sortOrder
        });

        this.selection ??= new SelectionSlice(config.selection, {
            rows: this.rows
        });

        this.visibleRows ??= new VisibleRowSlice(config.visibleRows, {
            scheduler: this.scheduler,
            page: this.page,
            rows: this.rows,
            filter: this.filter
        });
    }
}

type DependencyKeys<TName extends SliceKeys> = keyof State<TableData>[TName][typeof dependenciesSymbol];

type SubDependencyKeys = {
    [K in SliceKeys]: DependencyKeys<K> | SubDependencyKeys[DependencyKeys<K> & SliceKeys]
};


export type SharedSlices<TData extends TableData, TShared extends SliceKeys> = PartialByValue<{
    [K in SliceKeys]: K extends Exclude<TShared, SubDependencyKeys[TShared]> ? State<TData>[K] : undefined
}>

export type SharedConfig<TData extends TableData, TShared extends SliceKeys> = PartialByValue<{
    [K in SliceKeys]: K extends TShared | SubDependencyKeys[TShared] ? undefined : State<TData>[K]['config']
}>

export type Shared<TData extends TableData, TShared extends SliceKeys> = PartialByValue<{
    [K in SliceKeys]: K extends SubDependencyKeys[TShared] ? undefined :
        K extends TShared ? State<TData>[K] : State<TData>[K]['config']
}>