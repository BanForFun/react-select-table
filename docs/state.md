# State

#### `selection` *Set*

> Default: `new Set()`

Contains the values of the selected rows. The selected rows have a green background by default.

#### `activeIndex` *number*

> Default: `0`

The index of the active row in the items array. The active row has a green underline by default and is mainly used as a cursor for keyboard navigation.

#### `pivotIndex` *number*

> Default: `0`

The index of the pivot row in the items array. The pivot row is used to calculate the selection when using **Shift** + **Click** / **Up** / **Down** / **Home** / **End**.

#### `filter` *any*

> Default: `null`

If truthy, it is passed to `itemPredicate` to decide which rows to show to the user. Otherwise, all items are shown.

#### `items` *object*

> Default: `{}`

The items keyed by `valueProperty`, before parsing, sorting, filtering and pagination.

#### `sortBy` *object*

> Default: `{}`

The keys are the property paths based on which the items will be sorted. The values are either `asc` for ascending or `desc` for descending order.

#### `tableItems` *object*[]

> Default: `[]`

The items after parsing, sorting and filtering, but before pagination.

#### `isLoading` *boolean*

> Default: `false`

When true, the `loadingIndicator` is rendered instead of the table.

#### `pageSize` *number*

> Default: `0`

The maximum number of rows a page can contain. When set to 0 pagination is disabled.

#### `pageIndex` *number*

> Default: `0`

The index of the current page. Has no effect if the page size is 0.

#### `error` *any*

> Default: `null`

When truthy, it is passed as a prop to the `Error` component, which will be rendered instead of the table.