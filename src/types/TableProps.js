import PropTypes from 'prop-types'
// eslint-disable-next-line no-unused-vars
import React from 'react'

/**
 * The column properties
 *
 * @typedef {PropTypes.InferProps<columnShape>} Column
 */
const columnShape = {
  /**
   * The text that will be displayed in the header
   */
  title: PropTypes.string,

  /**
   * The path of a row property that will be passed as the first argument to the {@link render} function,
   * and also to {@link Options.itemComparator} when sorting by this column.
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
   *
   * @param {number|*} defaultContent The row's property at {@link path}, or the row index if undefined
   * @param {object} row The entire row object
   * @param {object} options Extra options you can set for the cell
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
}

/**
 * The props of the {@link Table} component
 *
 * @typedef {PropTypes.InferProps<tableProps>} TableProps
 */

const eventHandlerProps = {
  /**
   * Called on right-click or two-finger tap
   *
   * @param {Set|?*} target
   * If {@link Options.listBox} is on: The active row's {@link RowKey|value}, or null if Alt is held.
   * If listBox option is off: A Set of all selected values, or an empty Set if Alt is held
   * @see Actions.setActiveIndex
   */
  onContextMenu: PropTypes.func,

  /**
   * Called on double-click or enter-press
   *
   * @param {Set} selection The current row selection
   * @param {boolean} fromKeyboard Indicates whether the event was caused by keyboard input
   */
  onItemsOpen: PropTypes.func,

  /**
   * Called when the selection changes
   *
   * @param {Set} selection The new row selection
   */
  onSelectionChange: PropTypes.func,

  /**
   * Called when column resizing ends
   *
   * @param {number[]} widths The new column width percentages
   */
  onColumnResizeEnd: PropTypes.func,

  /**
   * Pass-through of the keydown event, with added selection argument. Return false to prevent default behaviour
   *
   * @param {object} e The original keydown event argument
   * @param {Set} selection The current row selection
   */
  onKeyDown: PropTypes.func
}

const tableProps = {
  ...eventHandlerProps,
  /**
   * Used to link a table component with a reducer.
   * Must match to the one passed as {@link createTable}
   * Multiple table components can share a namespace.
   */
  namespace: PropTypes.string.isRequired,

  /**
   * Used to differentiate between multiple tables within the same {@link namespace}.
   * Optional if this the only table in its namespace
   */
  name: PropTypes.string,

  /**
   * All columns
   *
   * @see Column
   */
  columns: PropTypes.arrayOf(PropTypes.shape(columnShape)).isRequired,

  /**
   * An array of indices of the {@link columns} array, used to reorder and hide columns
   */
  columnOrder: PropTypes.arrayOf(PropTypes.number),

  /**
   * Displayed instead of the table rows when there is an error, with the error as a child
   *
   * @see Actions.setError
   */
  errorComponent: PropTypes.elementType,

  /**
   * Custom component for navigating between pages
   *
   * @type {React.FC<import("./PaginationProps").PaginationProps>}
   * @see Actions.setPageSize
   */
  paginationComponent: PropTypes.elementType,

  /**
   * Displayed below header when loading
   *
   * @see Actions.startLoading
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
   *
   * @param {object} row The row object
   */
  getRowClassName: PropTypes.func
}

export const eventHandlerNames = Object.keys(eventHandlerProps)

export default tableProps
