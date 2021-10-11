import _ from "lodash";
import Hooks from "../models/Hooks";
import SimpleSelectors from "../models/SimpleSelectors";
import Actions from "../models/Actions";
import EventRaisers from "../models/EventRaisers";

export const tableUtils = {};

const noop = () => {};
export const defaultEventHandlers = {
    onContextMenu: noop,
    onSelectionChange: noop,
    onItemsOpen: noop,
    onColumnsResizeEnd: noop,
    onKeyDown: noop
}

let moduleIndex = 0;
const getModuleValue = () => Math.pow(2, moduleIndex++);
export const tableModules = {
    Search: getModuleValue(),
    Selection: getModuleValue(),
    Pagination: getModuleValue(),
    Sorting: getModuleValue(),
    Filtering: getModuleValue(),
    Items: getModuleValue()
}

tableModules.Rows = tableModules.Items | tableModules.Filtering | tableModules.Sorting;
tableModules.Selection |= tableModules.Rows;

const defaultOptions = {
    itemPredicate: _.isMatch,
    itemComparators: {},
    searchPhraseParser: str => str.normalize("NFD").toLowerCase(),
    searchProperty: null,
    multiSelect: true,
    listBox: false,
    valueProperty: "id",
    constantWidth: false,
    minColumnWidth: 20,
    path: null,
    initState: {},
    context: null
};

export function setDefaultTableOptions(options) {
    Object.assign(defaultOptions, options);
}

export function setOptions(namespace, options) {
    Object.freeze(_.defaults(options, defaultOptions));

    const actions = Actions(namespace);
    const simpleSelectors = SimpleSelectors(options);
    const hooks = Hooks(options, actions, simpleSelectors);

    const eventHandlers = {...defaultEventHandlers};
    const eventRaisers = EventRaisers(eventHandlers, options, simpleSelectors);

    return tableUtils[namespace] = {
        public: {
            actions,
            hooks,
            selectors: simpleSelectors,
            options,
            eventRaisers
        },
        private: {
            selectors: simpleSelectors,
            eventHandlers
        }
    };
}

export function getTableUtils(namespace) {
    return tableUtils[namespace].public;
}
