# State

### `selection` [*Set*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

**Default:** `new Set()`

The values of the selected rows. With the default theme, the selected rows have a green background.

### `activeIndex` *number*

**Default:** `0`

The index of the active row in the [item array][]. The active row is used as a cursor for keyboard navigation. With the default theme, it has a green underline.

### `pivotIndex` *number*

**Default:** `0`

The index of the pivot row in the [item array][]. The pivot row is used to calculate the selection when using **Shift** + **Click** / **Up** / **Down** / **Home** / **End**.

### `filter` *any*

**Default:** `null`

If truthy, it is passed to the [item predicate](./options.md#itempredicate-function) to decide which rows to show to the user. Otherwise, all items are shown.

### `items` *object*

**Default:** `{}`

The items keyed by [value][], before parsing, sorting, filtering and pagination.

### `sortBy` *object*

**Default:** `{}`

The keys are the property paths based on which the items will be sorted. The values are either `asc` for ascending or `desc` for descending order.

### `tableItems` *object[]*

**Default:** `[]`

The items after parsing, sorting and filtering, but before pagination.

When empty, a [placeholder](./component.md#emptyPlaceholder-node) is rendered instead of the table items.

### `isLoading` *boolean*

**Default:** `false`

When truthy, a [loading indicator](./component.md#loadingIndicator-node) is rendered instead of the table.

### `pageSize` *number*

**Default:** `0`

The maximum number of rows a page can contain. When set to zero pagination is disabled.

When not zero, a [pagination component](./component.md#pagination-elementType) is rendered below the table.

### `page` *number*

**Default:** `1`

The current page. Has no effect if the [page size](#pagesize-number) is 0.

### `error` *any*

**Default:** `null`

When truthy, an [error message](./component.md#error-elementType) is rendered instead of the table.



[value]: ./options.md#valueproperty-string
[item array]: #tableitems-object