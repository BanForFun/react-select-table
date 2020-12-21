# 5.0.0

## Breaking changes

### Exports

* Removed `Table` component as it was limiting the features
* Removed `useTable` hook
* Removed `withTables` HOC
* Removed `makeGetPageCount` selector factory. See `getPageCount` utility
* Removed `getTableSlice` selector. See `getStateSlice` utility



### Actions

* Renamed creators and type constants

  | Old creator name | New creator name | Old type constant | New type constant |
  | ---------------- | ---------------- | ----------------- | ----------------- |
  | `clearRows`      | `clearItems`     | `CLEAR_ROWS`      | `CLEAR_ITEMS`     |
  | `setRows`        | `setItems`       | `SET_ROWS`        | `SET_ITEMS`       |
  | `deleteRows`     | `deleteItems`    | `DELETE_ROWS`     | `DELETE_ITEMS`    |
  | `setRowValues`   | `setItemValues`  | `SET_ROW_VALUES`  | `SET_ITEM_VALUES` |
  | `patchRows`      | `patchItems`     | `PATCH_ROWS`      | `PATCH_ITEMS`     |
  | `sortBy`         | `sortItems`      | `SORT_BY`         | `SORT_ITEMS`      |
  | `setFilter`      | `setItemFilter`  | `SET_FILTER`      | `SET_ITEM_FILTER` |
  | `addRows`        | `addItems`       | `ADD_ROWS`        | `ADD_ITEMS`       |

* Replaced `setRowSelected` with `setSelected`

* Replaced `setActiveRow` with `setActive`

* Replaced `selectRow` with `select`

* Changed `contextMenu` parameters and payload

* Removed aliases `setRowValue`, `addRow` and `patchRow`

* `clearItems` now sets loading state to false. Use `startLoading` instead

* Removed optional `keyed` *boolean* parameter from `setItems`. The rows must always be passed as array.

* `setItems`, `deleteItems`, `clearItems` and `setItemFilter` now clear the selection

* Made `goToPage` index parameter zero-based

* `addItems` selects all added items

* `patchItems` doesn't create a row, if one does not exist with the given value



### Events

* The selected values argument passed to `onContextMenu`, `onItemsOpen`, `onSelectionChange` and `onKeyDown` has changed



### Visuals

* Table header not rendered while there are no visible items



### Component props

* Replaced `renderError` *function* with `Error` *elementType*
* Removed `context`, must be passed as option instead
* Made `namespace` required, and `name` optional



### State

* Replaced `activeValue` with `activeIndex`
* Replaced `pivotValue` with `pivotIndex`
* Replaced `selectedValues` with `selection`
* Replaced `currentPage` with `pageIndex`



### Options

* Removed `initItems` option
* react-redux context is now passed as the `context` option



## Non-breaking changes

* Added `startLoading` action creator
* Added `scrollFactor` component prop
* Added `getUtils` method
* Added `useTableStoreHooks` hook
* Added `Pagination` component prop
* Added `showSelectionRect` component prop
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
