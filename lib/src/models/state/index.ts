import HistorySlice from './HistorySlice';
import HeaderSlice from './HeaderSlice';
import RowSlice from './RowSlice';
import { TableData } from '../../utils/configUtils';
import SchedulerSlice from './SchedulerSlice';
import SortOrderSlice from './SortOrderSlice';
import HeaderSizeSlice from './HeaderSizeSlice';
import SelectionSlice from './SelectionSlice';
import FilterSlice from './FilterSlice';
import { dependenciesSymbol } from '../StateSlice';
import { PartialByValue } from '../../utils/typeUtils';
import { patch } from '../../utils/objectUtils';
import ColumnSlice from './ColumnSlice';

export default class State<TData extends TableData, TShared extends SliceKeys = never> {
    scheduler: SchedulerSlice;
    headers: HeaderSlice<TData>;
    sortOrder: SortOrderSlice<TData>;
    headerSizes: HeaderSizeSlice<TData>;
    history: HistorySlice;
    selection: SelectionSlice<TData>;
    filter: FilterSlice<TData>;
    rows: RowSlice<TData>;
    columns: ColumnSlice<TData>;

    #installDependencies(dependencies: Partial<State<TData>>) {
        for (const name in this) {
            const sliceName = name as SliceKeys; //This is safe to assume at this point

            const dependency = dependencies[sliceName];
            if (!dependency) continue;

            const installed = this[sliceName];
            if (!installed)
                this.#installDependencies(dependency[dependenciesSymbol]);
            else if (installed !== dependency)
                throw new Error('Incompatible dependencies');
        }

        patch(this, dependencies);
    }

    constructor(slices: SharedSlices<TData, TShared>, config: SharedConfig<TData, TShared>) {
        this.#installDependencies(slices);

        this.scheduler ??= new SchedulerSlice(config.scheduler, {});

        this.columns ??= new ColumnSlice(config.columns!, {});

        this.filter ??= new FilterSlice(config.filter, {});

        this.history ??= new HistorySlice(config.history, {
            scheduler: this.scheduler
        });

        this.sortOrder ??= new SortOrderSlice(config.sortOrder, {
            history: this.history,
            scheduler: this.scheduler,
            columns: this.columns
        });

        this.headers ??= new HeaderSlice(config.headers, {
            scheduler: this.scheduler,
            history: this.history,
            columns: this.columns
        });

        this.headerSizes ??= new HeaderSizeSlice(config.headerSizes!, {
            scheduler: this.scheduler,
            history: this.history,
            headers: this.headers
        });

        this.rows ??= new RowSlice(config.rows!, {
            history: this.history,
            scheduler: this.scheduler,
            sortOrder: this.sortOrder,
            filter: this.filter
        });

        this.selection ??= new SelectionSlice(config.selection, {
            rows: this.rows
        });
    }
}

type SliceKeys = keyof State<TableData>;

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

// export type Shared<TData extends TableData, TShared extends SliceKeys> = PartialByValue<{
//     [K in SliceKeys]: K extends SubDependencyKeys[TShared] ? undefined :
//         K extends TShared ? State<TData>[K] : State<TData>[K]['config']
// }>

// Public
export function createState<
    TRow extends object,
    TError extends NonNullable<unknown> = never,
    TFilter extends NonNullable<unknown> = never
>(config: SharedConfig<TableData<TRow, TError, TFilter>, never>) {
    return new State({}, config);
}

// Public
export function createSharedState<
    TShared extends SliceKeys,
    TRow extends object,
    TError extends NonNullable<unknown> = never,
    TFilter extends NonNullable<unknown> = never
>(
    slices: SharedSlices<TableData<TRow, TError, TFilter>, TShared>,
    config: SharedConfig<TableData<TRow, TError, TFilter>, TShared>
) {
    return new State(slices, config);
}