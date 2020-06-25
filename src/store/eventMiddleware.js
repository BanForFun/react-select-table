import { default as actions } from "../models/actions";
import { tableOptions } from "../utils/optionUtils";
import { areItemsEqual, inArray } from "../utils/arrayUtils";
import { makeGetStateSlice } from "../selectors/namespaceSelectors";

const eventMiddleware = store => next => action => {
    const { type, namespace } = action;

    const getSlice = makeGetStateSlice();
    const getTable = () => getSlice(store.getState(), namespace);

    switch (type) {
        case actions.SET_ROWS:
        case actions.DELETE_ROWS:
        case actions.SET_ROW_VALUE:
        case actions.CLEAR_ROWS:
        case actions.SET_FILTER:
        case actions.SELECT_ROW:
        case actions.CLEAR_SELECTION:
        case actions.SET_ROW_SELECTED:
        case actions.SELECT_ALL:
        case actions.CONTEXT_MENU:
            const options = tableOptions[namespace];
            const prevSel = getTable().selectedValues;

            const result = next(action);
            const table = getTable();

            //Raise onSelectionChange
            if (!areItemsEqual(prevSel, table.selectedValues))
                options.onSelectionChange(table.selectedValues);

            //Raise onContextMenu
            if (type === actions.CONTEXT_MENU)
                options.onContextMenu(options.listBox
                    ? inArray(table.activeValue) : table.selectedValues);

            return result;
        default:
            return next(action);
    }
}

export default eventMiddleware;
