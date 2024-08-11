import { Column } from './columnUtils';

export interface TableData<
    TRow = object,
    TError = NonNullable<unknown>,
    TFilter = NonNullable<unknown>
> {
    row: TRow;
    error: TError;
    filter: TFilter;
}

interface SavedState {

}

// Public
export interface DefaultConfig {
    parseSearchPhrase: (phrase: string) => string;
    allowMultipleSelection: boolean;
    enableSelectorMode: boolean;
    minColumnWidthInPixels: number;
    keepTotalColumnWidthConstant: boolean;
    defaultColumnWidthPercentage: number;
    fixedRowHeight?: string;
}

// Public
export interface ConfigOverride<TData extends TableData> extends Partial<DefaultConfig> {
    getRowKey: (row: TData['row']) => string;
    columns: Column<TData['row']>[];
    getRowSearchablePhrase?: (row: TData['row']) => string;
    loadSavedState?: SavedState;
    shouldRowBeVisible?: (row: TData['row'], filter: TData['filter']) => boolean;
}

export type Config<TData extends TableData> = ConfigOverride<TData> & DefaultConfig;

export const defaultConfig: DefaultConfig = {
    parseSearchPhrase: p => p.normalize('NFD').toLowerCase(),
    allowMultipleSelection: true,
    enableSelectorMode: false,
    minColumnWidthInPixels: 50,
    keepTotalColumnWidthConstant: false,
    defaultColumnWidthPercentage: 25
};

// Public
export function modifyDefaultConfig(modifications: Partial<DefaultConfig>): void {
    Object.assign(defaultConfig, modifications);
}