import actions from "../models/actions";
import { tableOptions } from "../utils/optionUtils";
import { getTableSlice } from "../utils/reduxUtils";

function compareMapKeys(a, b) {
    //Compare references
    if (a === b) return true;

    //Compare length
    if (a.size !== b.size) return false;

    //Compare items
    for (let key of a.keys())
        if (!b.has(key)) return false;

    return true;
}

const eventMiddleware = store => next => action => {
    const { type, namespace } = action;

    const getTable = () => getTableSlice(store.getState(), namespace);

    switch (type) {
        case actions.SET_ROWS:
        case actions.DELETE_ROWS:
        case actions.SET_ROW_VALUES:
        case actions.CLEAR_ROWS:
        case actions.SET_FILTER:
        case actions.SELECT_ROW:
        case actions.CLEAR_SELECTION:
        case actions.SET_ROW_SELECTED:
        case actions.SELECT_ALL:
        case actions.CONTEXT_MENU:
            const options = tableOptions[namespace];
            const prevSel = getTable().selection;

            const result = next(action);
            const table = getTable();

            const getSelected = () => Array.from(table.selection.keys());

            //Raise onSelectionChange
            if (!compareMapKeys(prevSel, table.selection))
                options.onSelectionChange(getSelected());

            //Raise onContextMenu
            if (type === actions.CONTEXT_MENU)
                options.onContextMenu(options.listBox ? table.activeValue : getSelected());

            return result;
        default:
            return next(action);
    }
}

export default eventMiddleware;
