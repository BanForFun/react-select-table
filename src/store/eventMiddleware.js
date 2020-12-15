import actions from "../models/actions";
import {tableOptions} from "../utils/optionUtils";

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

    switch (type) {
        case actions.SET_ITEMS:
        case actions.DELETE_ITEMS:
        case actions.SET_ITEM_VALUES:
        case actions.CLEAR_ITEMS:
        case actions.SET_ITEM_FILTER:
        case actions.SELECT:
        case actions.CLEAR_SELECTION:
        case actions.SET_SELECTED:
        case actions.SELECT_ALL:
        case actions.SET_ERROR:
        case actions.START_LOADING:
        case actions.CONTEXT_MENU:
            const options = tableOptions[namespace];
            const { events, utils } = options;

            const getState = () => utils.getStateSlice(store.getState());

            const prevState = getState();
            const result = next(action);
            const state = getState();

            const {selection} = state;

            //Raise onSelectionChange
            if (!compareSets(prevState.selection, selection))
                events.onSelectionChange(utils.formatSelection(selection));

            //Raise onContextMenu
            if (type === actions.CONTEXT_MENU)
                events.onContextMenu(options.listBox
                    ? utils.getItemValue(state, payload.ctrlKey ? state.activeIndex : payload.index)
                    : utils.formatSelection(selection)
                );

            return result;
        default:
            return next(action);
    }
}

export default eventMiddleware;
