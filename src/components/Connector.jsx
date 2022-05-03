import React, {useEffect} from 'react';
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

    return <Root {...rootProps} />
}

const Table = React.forwardRef(Connector);

/**
 * @namespace Table
 */

/**
 * @name goToPage
 * @function
 * @param {number} pageNumber The page number to take the user to
 * @returns {boolean} True if succeeded
 */

Table.propTypes = {
    /**
     * Used to associate a table component with the redux store,
     * and must match to the {@link options.namespace} given to the reducer.
     * Multiple tables can share a namespace.
     */
    namespace: PropTypes.string.isRequired,

    /**
     * Used to differentiate between multiple tables the share the same {@link namespace}.
     * Optional if this the only table in its namespace
     */
    name: PropTypes.string,

    /**
     * All columns
     */
    columns: PropTypes.arrayOf(PropTypes.shape({
        /**
         * The text that will be displayed in the header
         */
        title: PropTypes.string,

        /**
         * The path of a row property that will be passed as the first argument to the {@link render} function,
         * and also to {@link options.itemComparator} when sorting by this column.
         * If defined, it makes the column sortable. If that is not desirable, read and return the property from
         * the row argument inside the render function, instead of defining path.
         */
        path: PropTypes.string,

        /**
         * A unique identifier for the column.
         * Must be defined if {@link path} is not, or if multiple columns use the same path
         */
        key: PropTypes.string,

        /**
         * Returns the content to be displayed in the cell.
         * If not defined, the defaultContent argument will be displayed directly.
         * @param {number|*} defaultContent The row's property at {@link path}, or the row index if undefined
         * @param {Object} row The entire row object
         * @param {Object} options Extra options you can set for the cell
         * @param {string} options.className A class to be given to the cell
         */
        render: PropTypes.func,

        /**
         * Use a th instead of a td element
         */
        isHeader: PropTypes.bool,

        /**
         * The default width percentage for the column. The default is: 100 / <column count>
         */
        defaultWidth: PropTypes.number
    })).isRequired,

    /**
     * An array of indices of the {@link columns} array, used to reorder and hide columns
     */
    columnOrder: PropTypes.arrayOf(PropTypes.number),

    /**
     * Displayed instead of the table rows when there is an error, with the error as a child
     * @see actions.setError
     */
    errorComponent: PropTypes.elementType,

    /**
     * Custom component for navigating between pages
     * @param {Object} props The component props
     * @param {number} props.page The page number the user is currently in (1 based)
     * @param {number} props.pageCount The total page count
     * @param {goToPage} props.goToPage Takes the user to another page
     * @see actions.setPageSize
     */
    paginationComponent: PropTypes.elementType,

    /**
     * Displayed below header when loading
     * @see actions.startLoading
     */
    loadingIndicator: PropTypes.node,

    /**
     * Displayed below header when there are no rows
     */
    emptyPlaceholder: PropTypes.node,

    /**
     * Element id for the table container
     */
    id: PropTypes.string,

    /**
     * Element class for the table container
     */
    className: PropTypes.string,

    /**
     * Send focus to the table container after rendering
     */
    autoFocus: PropTypes.bool,

    /**
     * Speed of automatic scrolling when drag-selecting
     */
    dragSelectScrollFactor: PropTypes.number,

    /**
     * Speed of automatic scrolling when resizing columns
     */
    columnResizeScrollFactor: PropTypes.number,

    /**
     * Returns a class for the tr element
     * @param {Object} row The row object
     */
    getRowClassName: PropTypes.func,

    /**
     * Called on right-click or two-finger tap
     * @param {Set|?*} target If {@link options.listBox} is on: The active row's value, or null if Alt is held.
     * If listBox option is off: A Set of all selected values, or an empty Set if Alt is held
     * @see actions.setActiveIndex
     * @see options.valueProperty
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

    /** Pass-through of the keydown event, with added selection argument. Return false to prevent default behaviour
     * @param {Object} e The original keydown event argument
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
