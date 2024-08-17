import { TableData } from '../../utils/configUtils';
import { Column, isColumnGroup } from '../../utils/columnUtils';
import { getAtPath, TreePath } from '../../utils/unrootedTreeUtils';
import StateSlice from '../StateSlice';

interface Dependencies {

}

export type SortOrder = 'ascending' | 'descending';
export type NewSortOrder = SortOrder | null | 'toggle' | 'cycle';

export default class ColumnSlice<TData extends TableData> extends StateSlice<Dependencies, Column<TData['row']>[]> {
    #paths = new Map<Column<TData['row']>, TreePath>();

    getAtPath(path: TreePath): Column<TData['row']> {
        return getAtPath(this.config, path);
    }

    #buildPaths(columns: Column<TData['row']>[], basePath: TreePath) {
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            const path = Object.freeze([...basePath, i]);
            this.#paths.set(column, path);

            if (isColumnGroup(column))
                this.#buildPaths(column.children, path);
        }
    }

    constructor(config: Column<TData['row']>[], state: Dependencies) {
        super(config, state);
        this.#buildPaths(config, []);
    }

    getPath(column: Column<TData['row']>) {
        const path = this.#paths.get(column);
        if (!path) throw new Error('Unknown column');

        return path;
    }

    getIndex(column: Column<TData['row']>) {
        return this.getPath(column).at(-1)!;
    }
}