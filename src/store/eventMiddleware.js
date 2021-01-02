import {types} from "../models/Actions";
import {tableStorage} from "../utils/storageUtils";

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
        case types.SET_ITEMS:
        case types.ADD_ITEMS:
        case types.DELETE_ITEMS:
        case types.PATCH_ITEMS:
        case types.SET_ITEM_VALUES:
        case types.CLEAR_ITEMS:
        case types.SET_ITEM_FILTER:
        case types.SELECT:
        case types.CLEAR_SELECTION:
        case types.SET_SELECTED:
        case types.SELECT_ALL:
        case types.SET_ERROR:
        case types.START_LOADING:
        case types.CONTEXT_MENU:
            //Get table options, events and utils
            const options = tableStorage[namespace];
            const { events, utils } = options;
            const getSlice = () => utils.getStateSlice(store.getState());

            //Get previous and current state
            const prevSlice = getSlice();
            const result = next(action);
            const slice = getSlice();

            //Raise onSelectionChange
            if (!compareSets(prevSlice.selection, slice.selection))
                events.onSelectionChange(utils.getSelectionArg(slice));

            //Raise onContextMenu
            if (type === types.CONTEXT_MENU)
                events.onContextMenu(options.listBox
                    ? utils.getItemValue(slice, payload.ctrlKey ? slice.activeIndex : payload.index)
                    : utils.getSelectionArg(slice)
                );

            return result;
        default:
            return next(action);
    }
}

export default eventMiddleware;
