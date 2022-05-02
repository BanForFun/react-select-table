import React, {useContext, useEffect} from 'react';
import {ReactReduxContext} from "react-redux";
import PropTypes from "prop-types";
import DefaultPagination from "./DefaultPagination";
import {tableUtils} from '../utils/tableUtils';
import Root from "./Root";
import {defaultEventHandlers} from "../models/EventRaisers";

function Connector(props, ref) {
    const {
        name, namespace,
        ...rootProps
    } = props;

    const utils = tableUtils[namespace];

    const { context } = utils.public.options;
    if (!context)
        throw new Error("Please import 'ReactReduxContext' from 'react-redux' and pass it to the 'context' option");

    const contextValue = useContext(context);

    //Register redux event handlers
    const { eventHandlers } = utils;
    for (const handlerName in eventHandlers) {
        const handler = props[handlerName];
        delete rootProps[handlerName];

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            eventHandlers[handlerName] = handler;
        }, [handler, eventHandlers, handlerName]);
    }

    rootProps.utils = utils.public;
    rootProps.containerRef = ref;
    rootProps.name ??= namespace;

    return <ReactReduxContext.Provider value={contextValue}>
        <Root {...rootProps} />
    </ReactReduxContext.Provider>
}

const Table = React.forwardRef(Connector);

const columnShape = PropTypes.shape({
    /** The text that will be displayed in the header */
    title: PropTypes.string,

    /**
     * The path for the row property that will be passed as the first argument to the render method.
     * If defined, it makes the column sortable. If that is not desirable, read and return the property from
     the 'row' argument inside the 'render' method, instead of defining 'path'.
     * If not defined, you must define 'key' instead.
     * */
    path: PropTypes.string,

    /** A unique identifier for the column. */
    key: PropTypes.string,

    /**
     * Returns the content to be displayed in the cell.
     * If not defined, the 'defaultContent' argument will be displayed directly.
     * @param {number|*} defaultContent The value of the row's 'path' property, or the row index if undefined
     * @param {Object} row The entire row object
     * @param {Object} options Extra options you can set for the cell
     * @param {string} options.className A class to be given to the cell
     * */
    render: PropTypes.func,

    /** Use a th instead of a td element */
    isHeader: PropTypes.bool
});

/**
 * If listBox option is on: The active value
 * If listBox option is off: A Set of all selected values
 * @typedef {Set|*} ContextMenuArg
 */

Table.propTypes = {
    /** Used to associate a table component with the redux store, multiple tables can share a namespace */
    namespace: PropTypes.string.isRequired,
    /**
     * Used to differentiate between multiple tables inside the same namespace.
     * Optional if this the only table in its namespace
     */
    name: PropTypes.string,
    /** All columns */
    columns: PropTypes.arrayOf(columnShape).isRequired,
    /** An array containing indices for the columns array, used to reorder and hide columns */
    columnOrder: PropTypes.arrayOf(PropTypes.number),
    /** Rendered instead of the table rows when there is an error */
    errorComponent: PropTypes.elementType,
    /** Component for navigating between pages */
    paginationComponent: PropTypes.elementType,
    /** Displayed when loading */
    loadingIndicator: PropTypes.node,
    /** Displayed below header when there are no rows */
    emptyPlaceholder: PropTypes.node,
    /** Element id for the table container */
    id: PropTypes.string,
    /** Element class for the table container */
    className: PropTypes.string,
    /** Send focus to the table after rendering */
    autoFocus: PropTypes.bool,
    /** Speed of automatic scrolling when drag-selecting */
    dragSelectScrollFactor: PropTypes.number,
    /** Speed of automatic scrolling when resizing columns */
    columnResizeScrollFactor: PropTypes.number,
    /**
     * Returns a class for the tr element
     * @param {Object} rowData The row object
     */
    getRowClassName: PropTypes.func,
    /**
     * Called on right-click or two-finger tap
     * @param {ContextMenuArg} selection The row(s) that the context menu concerns
     */
    onContextMenu: PropTypes.func,
    /**
     * Called on double-click or enter-press
     * @param {Set} selection The current row selection
     * @param {boolean} fromKeyboard Indicates whether the event was caused by keyboard input
     */
    onItemsOpen: PropTypes.func,
    /**
     * Called when the selection changes
     * @param {Set} selection The new row selection
     */
    onSelectionChange: PropTypes.func,
    /**
     * Called when column resizing ends
     * @param {number[]} widths The new column width percentages
     */
    onColumnResizeEnd: PropTypes.func,
    /** Pass-through of the keydown event with selection
     * @param {Object} e The original keydown event arg
     * @param {Set} selection The current row selection
     */
    onKeyDown: PropTypes.func
};

Table.defaultProps = {
    getRowClassName: () => null,
    className: "rst-default",
    dragSelectScrollFactor: 0.5,
    columnResizeScrollFactor: 0.2,
    errorComponent: 'span',
    paginationComponent: DefaultPagination,
    loadingIndicator: null,
    emptyPlaceholder: null,
    autoFocus: false,
    ...defaultEventHandlers
};

export default Table;
