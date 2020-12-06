# 5.0.0

## Breaking changes

* The selected values argument passed to event handlers `onContextMenu`, `onItemsOpen`, `onSelectionChange` and `onKeyDown`, is a single value when `multiSelect` option is disabled, and a [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) of values when it is enabled
* Removed `selectedValues` state property. Replaced with `selection` property
* `clearRows` action now sets `isLoading` state to false instead of true
* Action creator `setRowSelected` calls `setRowsSelected` (action type and payload format has changed)
* Removed optional `keyed` *boolean* parameter for `setRows` action creator. The rows are assumed to be keyed, if the `items` argument is an object
* Removed `loadingIndicator` Table component prop
* Action creator `clearRows` clears the selection even if `listBox` option is enabled
* Table header not rendered while there are no visible items
* `initItems` option accepts keyed items as object
* Removed `Table` component and everything related, as it was limiting the features of `TableCore`
* `setRows` clears the selection
* Removed `activeValue` and `pivotValue`, replaced with `activeIndex` and `pivotIndex`
* Removed action creator `setActiveValue`, replaced with `setActiveIndex`
* `currentPage` and  `goToPage` parameter are zero-based (instead of one-based)
* Action creators `setRowSelected`, `contextMenu` and `selectRow` take the row index instead of the value

## Non-breaking changes

* Added `startLoading` action creator
* Added `setRowsSelected` action creator
* Added `scrollFactor` component prop
* Added `setPivotIndex` action creator
* Added `keyedItems` *object* property to `useTable` result
* The [classnames](https://www.npmjs.com/package/classnames) library is used to parse the `_className` property of rows, so objects and arrays are accepted as well as strings



# 4.0.0

## Breaking changes

* Removed `replaceRow` action as [`addRow`](./actions.md#addrow) can be used for the same purpose
* Renamed `isListbox` option to [`listBox`](./options.md#listbox-boolean)
* Renamed `isMultiselect` option to [`multiSelect`](./options.md#multiselect-boolean)
* On [`onContextMenu`](./common.md#oncontextmenu-function), the active value argument is no longer an array (if the [`listBox`](./options.md#listbox-boolean) option is enabled)
* [Loading state](./state.md#isloading-boolean) is now false by default
* [`patchRow`](./actions.md#patchrow) no longer accepting row value as the first parameter. The value property must be included in the patch, which is now the first parameter.
* [`clearRows`](./actions.md#clearrows) action now clears the active row as well
* [`clearRows`](./actions.md#clearrows) action no longer clears the selection if the [`listBox`](./options.md#listbox-boolean) option is enabled
* `defaultOptions` object is no longer exported. Use the [`setDefaultOptions`](./utils.md#setdefaultoptions) function
* Removed `initState` (3rd) parameter from the [`createTable`][./core.md#setup] function. Initial state can now be set with the [`initState`](./options.md#initstate-object) option
* Removed `withTable` HOC and replaced with [`withTables`](./table.md#setup) HOC and [`useTable`](./table.md#usetable) hook
* Removed `getTablePath` function and replaced with the [`getTableSlice`](./utils.md#gettableslice) function
* Removed `columnOrder` state property and `setColumnOrder` action creator. Replaced with [`columnOrder`](./common.md#columnorder-number) prop on the component
* Removed `columnWidth` state property and `setColumnWidth` action creator. Column widths can no longer be controlled, except for the initial state which can be set with the [`initColumnWidths`](./common.md#initcolumnwidths-number) prop on the component
* Items before could have a `classNames` property set to an array of class names which would be applied to the **tr** element. This property has been renamed to `_className` and is now a string
* [`onContextMenu`](./common.md#oncontextmenu) is now raised even when the table is empty
* Table header no longer rendered when the table is loading
* Removed `SET_ROW_VALUE` action type. See the new [`setRowValues`](./actions.md#setrowvalues) action creator for details.
* Removed `ADD_ROW` action type. See the new [`addRows`](./actions.md#addrows) action creator for details.
* Removed `PATCH_ROW` action type. See the new [`patchRows`](./actions.md#patchrows) action creator for details.
* Default [`valueProperty`](./options.md#valueproperty-string) option is now `"id"`

## Non-breaking changes

* Added [`setError`](./actions.md#seterror) action creator and [`error`](./state.md#error-any) state property
* Added `isKeyed` as optional second argument to [`setRows`](./actions.md#setrows) action creator
* Added [`renderError`](./core.md#rendererror-function) function TableCore component prop
* Added [`loadingIndicator`](./common.md#loadingIndicator-node) node component prop
* Added [`addRows`](./actions.md#addrows) action creator
* Added [`setRowValues`](./actions.md#setrowvalues) action creator
* Added [`patchRows`](./actions.md#patchrows) action creator
* Added [`className`](./column.md#classname-string) property for columns
* Added [`onKeyDown`](./common.md#onkeydown-function) function component prop



# 3.0.0

## Breaking changes

* Renamed `table` to `namespace` in the action payload

* Renamed `reducerName` component prop to `namespace`

* `sortPath` and `sortOrder` state properties replaced by `sortBy`

* When creating a store, you must now apply the `eventMiddleware` middleware in order for events to be raised

* Actions can now be dispatched in all event handlers

* Removed `statePath` component prop. The state path must now be passed as the `path` option

* The `createTable` method is now exported at top level (it used to be under `TableReducer`)
* Removed deprecated `useTable` hook and `initTable`/`disposeTable` functions. Use `withTable` HOC instead
* Removed `withTables` HOC, each table component must now live in a separate component using the `withTable` HOC

## Non-breaking changes

* Added `multiSort` option



# 2.4.0

* `initTable`/`disposeTable` and `useTable` are deprecated and replaced by the `withTable` and `withTables` HOCs



# 2.3.0

* Added pagination support. Page size can be set with the `setPageSize` action creator. Current page can be set with the `goToPage` action creator. The number of pages can be retrieved using the `makeGetPageCount` selector.



# 2.2.0

* Vertical scrollbar is now full height



# 2.1.0

* Added horizontal scrolling (disabled by default). Can be enabled by setting the `scrollX` option to true.



# 2.0.0

## Breaking changes

* Action types are now static and the table name is passed in the action's `table` property

* Actions now have a `payload` property. The payload is no longer spread inside the action

* Swapped position of `createTable` parameters: `initState` and `options`

* State properties `isMultiselect`, `isListbox`, `minColumnWidth` and `valueProperty` are now constant and must be passed as properties of the `options` object (second parameter of `createTable`) 

* Removed `setMultiselect`, `setListboxMode`, `setMinColumnWidth` and `setValueProperty` action creators
* Removed component props `isMultiselect`, `isListbox`, `minColumnWidth` and `valueProperty` 