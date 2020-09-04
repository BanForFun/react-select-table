# 4.0.0

## Breaking changes

* Removed `replaceRow` action as `setRow` can be used for the same purpose
* Renamed `isListbox` option to `listBox`
* Renamed `isMultiselect` option to `multiSelect`
* Renamed `loadingPlaceholder` prop to `loadingIndicator`
* If `listBox` option is true, `onContextMenu` is now raised with `activeValue` state as the first parameter (used to be enclosed in an array)
* `isLoading` initial state is now false by default
* `patchRow` no longer accepting row value as the first parameter. Value property must be included in the patch
* `clearRows` action sets `activeRow` to null
* `clearRows` action doesn't clear the selection if `listBox` option is true
* `defaultOptions` object is no longer exported. Use `setDefaultOptions` method
* Removed `initState` (third) parameter from `createTable` method. Initial state can now be set with the `initState` option
* Removed `withTable` HOC and replaced with `withTables` and `useTable`
* Removed `getTablePath` method and replaced with `getTableSlice`

## Potentially breaking changes

* `onContextMenu` is now raised even when the table is empty
* Table header no longer rendered when `isLoading` state is true
* Action `payload` is no longer an object when only one property is needed. Applies to action type constants: `GO_TO_PAGE`, `SET_PAGE_SIZE`, `SET_FILTER`, `PATCH_ROW`, `DELETE_ROWS`, `ADD_ROWS`, `SET_COLUMN_ORDER`, `SET_ACTIVE_ROW`, `SET_ERROR`
* `setRowValue` action creator now alias for `setRowValues`
* `addRow` action creator now alias for `addRows`
* `patchRow ` action creator now alias for `patchRows`

## Non-breaking changes

* Added `setError` action and `error` state property
* Added `isKeyed` as optional second argument to `setRows` action creator
* Added `renderError` method prop
* Added `setRows` action creator
* Added `setRowValues` action creator
* Added `patchRows` action creator
* Added `className` property to columns
* Added `onKeyDown` event prop
* Added `columnOrder` array prop to `Table` component

