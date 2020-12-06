import actions from "../models/actions";
import {formatSelection, tableOptions} from "../utils/optionUtils";
import { getTableSlice } from "../utils/reduxUtils";

function compareSets(a, b) {
    //Compare references
    if (a === b) return true;

    //Compare length
    if (a.size !== b.size) return false;

    //Compare items
    for (let entry of a)
        if (!b.has(entry)) return false;

    return true;
}

const eventMiddleware = store => next => action => {
    const { type, namespace, payload } = action;
    const getState = () => getTableSlice(store.getState(), namespace);

    switch (type) {
        case actions.SET_ROWS:
        case actions.DELETE_ROWS:
        case actions.SET_ROW_VALUES:
        case actions.CLEAR_ROWS:
        case actions.SET_FILTER:
        case actions.SELECT_ROW:
        case actions.CLEAR_SELECTION:
        case actions.SET_ROWS_SELECTED:
        case actions.SELECT_ALL:
        case actions.SET_ERROR:
        case actions.START_LOADING:
        case actions.CONTEXT_MENU:
            const options = tableOptions[namespace];

            const prevState = getState();
            const result = next(action);
            const state = getState();

            const {selection} = state;

            //Raise onSelectionChange
            if (!compareSets(prevState.selection, selection))
                options.onSelectionChange(formatSelection(selection, namespace));

            //Raise onContextMenu
            if (type === actions.CONTEXT_MENU)
                options.onContextMenu(options.listBox
                    ? payload.value
                    : formatSelection(selection, namespace)
                );

            return result;
        default:
            return next(action);
    }
}

export default eventMiddleware;
