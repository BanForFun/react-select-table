import _ from "lodash";
import Hooks from "../models/Hooks";
import SimpleSelectors from "../models/SimpleSelectors";
import Actions from "../models/Actions";
import EventRaisers, {defaultEventHandlers} from "../models/EventRaisers";

export const DragModes = Object.freeze({
    Resize: "resize",
    Select: "select"
});

export const GestureTargets = Object.freeze({
    Header: -2,
    BelowItems: -1
});

export const px = n => `${n}px`;
export const pc = n => `${n}%`;

export const tableUtils = {};

export const tableModules = {
    Search: 0b0000001,
    Selection: 0b0100010,
    Pagination: 0b0000100,
    Sorting: 0b0001000,
    Filtering: 0b0010000,
    Items: 0b0100000,
};

const defaultOptions = {
    itemPredicate: _.isMatch,
    itemComparators: {},
    searchPhraseParser: (str) => str.normalize("NFD").toLowerCase(),
    searchProperty: null,
    multiSelect: true,
    listBox: false,
    valueProperty: "id",
    constantWidth: false,
    minColumnWidth: 50,
    chunkSize: 100,
    path: null,
    initState: {},
    context: null,
};

export function setDefaultTableOptions(options) {
    Object.assign(defaultOptions, options);
}

export function setOptions(namespace, options) {
    Object.freeze(_.defaults(options, defaultOptions));

    const actions = Actions(namespace);
    const simpleSelectors = SimpleSelectors(options);
    const hooks = Hooks(options, actions, simpleSelectors);

    const eventHandlers = { ...defaultEventHandlers };
    const eventRaisers = EventRaisers(eventHandlers, options, simpleSelectors);

    return (tableUtils[namespace] = {
        public: {
            actions,
            hooks,
            selectors: simpleSelectors,
            options,
            eventRaisers,
        },
        private: {
            selectors: simpleSelectors,
            eventHandlers,
        },
    });
}

export function getTableUtils(namespace) {
    return tableUtils[namespace].public;
}
