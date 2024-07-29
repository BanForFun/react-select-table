import { assignDefaults, deepFreeze } from './objectUtils';
import { Column } from './columnUtils';

interface SavedState {

}

interface DefaultConfig {
    parseSearchPhrase: (phrase: string) => string;
    allowMultipleSelection: boolean;
    enableSelectorMode: boolean;
    minColumnWidthInPixels: number;
    keepTotalColumnWidthConstant: boolean;
    defaultColumnWidthPc: number;
    areRowsSameHeight?: boolean;
}

export interface ConfigOverride<TRow, TFilter> extends Partial<DefaultConfig> {
    getRowKey: (row: TRow) => string;
    columns: Column<TRow>[];
    shouldRowBeVisible?: (row: TRow, filter: TFilter) => boolean;
    getRowSearchablePhrase?: (row: TRow) => string;
    loadSavedState?: SavedState;
}

export type Config<TRow, TFilter> = ConfigOverride<TRow, TFilter> & DefaultConfig;

const defaultConfig: DefaultConfig = {
    parseSearchPhrase: p => p.normalize('NFD').toLowerCase(),
    allowMultipleSelection: true,
    enableSelectorMode: false,
    minColumnWidthInPixels: 50,
    keepTotalColumnWidthConstant: false,
    defaultColumnWidthPc: 25,
    areRowsSameHeight: false
};

// Public
export function modifyDefaultConfig(modifications: Partial<DefaultConfig>): void {
    Object.assign(defaultConfig, modifications);
}

export function parseConfigOverride<TRow, TFilter>(override: ConfigOverride<TRow, TFilter>): Config<TRow, TFilter> {
    return deepFreeze(assignDefaults(override, defaultConfig));
}