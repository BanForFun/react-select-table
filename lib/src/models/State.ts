import HistoryState from './HistoryState';
import { Controller } from '../index';
import VisibleColumnsSlice from './VisibleColumnsSlice';

export default function createState<TRow, TFilter>(controller: Controller<TRow, TFilter>) {
    return {
        visibleColumns: new VisibleColumnsSlice<TRow, TFilter>(controller),
        history: new HistoryState<TRow, TFilter>()
    };
}

export type State<TRow, TFilter> = ReturnType<typeof createState<TRow, TFilter>>