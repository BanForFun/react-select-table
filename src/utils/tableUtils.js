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

// noinspection JSUnusedLocalSymbols
/**
 * @namespace options
 */
const defaultOptions = {
    /**
     * Decides whether a row should be visible based on the filter.
     * @see actions.setItemFilter
     * @param {Object} row The row in question
     * @param {*} filter The item filter
     * @returns {boolean} True if the row should be visible, false otherwise
     */
    itemPredicate: _.isMatch,

    /**
     * Compares two rows based on their property at the sorting column's {@link column.path}.
     * @param {*} lhs The property of the left hand side row
     * @param {*} rhs The property of the right hand side row
     * @param {string} path The column's path
     * @returns {?number} 1: lhs > rhs, 0: lhs == rhs, -1: lhs < rhs, null: Fallback to default comparator
     */
    itemComparator: (lhs, rhs, path) => null,

    /**
     * Parses the search phrase before matching it to the start of the rows' property at {@link searchProperty}.
     * @see actions.search
     * @param {string} phrase The search phrase, directly as typed by the user
     * @returns {string} The modified search phrase to be compared to the row property
     */
    searchPhraseParser: phrase => phrase.normalize("NFD").toLowerCase(),

    /**
     * The path of a row property that the search phrase is matched against
     */
    searchProperty: null,

    /**
     * Allow multiple rows to be selected simultaneously
     */
    multiSelect: true,

    /**
     * Retain selection when clicking in the space below the rows, and when right-clicking on another row
     */
    listBox: false,

    /**
     * The path of a row property that 1. has a unique value for each row, and 2. is of type NUMBER OR STRING
     */
    valueProperty: "id",

    /**
     * When resizing a column, shrink the next one by the same amount, keeping the total width constant
     */
    constantWidth: false,

    /**
     * The minimum width in pixels allowed for a column: 1. when resizing it,
     * and 2. before a scrollbar appears when shrinking the container
     */
    minColumnWidth: 50,

    /**
     * The maximum number of rows per chunk. A chunk is a collection of rows that is not rendered when not in view.
     * A big chunk size improves scrolling performance at the cost of column resizing performance.
     * Must be a multiple of 2 to preserve the stripped row pattern.
     * Note: Resizing a column only updates the current chunk, making scrolling using the scrollbar jerky when
     * chunks load in for the first time after resizing a column.
     */
    chunkSize: 100,

    /**
     * The path of the redux table state. Set to null if the table reducer is the root.
     */
    statePath: null,

    /**
     * The initial redux state, useful for restoring a user's session
     */
    initState: {},

    /**
     * If you use a custom context for your Provider, you can pass it here
     */
    context: undefined
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
        selectors: simpleSelectors,
        eventHandlers,
        public: {
            actions,
            hooks,
            selectors: simpleSelectors,
            options,
            eventRaisers,
        }
    });
}

export function getTableUtils(namespace) {
    return tableUtils[namespace].public;
}
