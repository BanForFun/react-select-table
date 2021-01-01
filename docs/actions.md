# Action creators

**Read the [state properties](./state.md), [options](./options.md) and [component props](./component.md) first**

The action creators are accessible from a `TableActions` instance. The constructor takes the table [namespace][namespace] as the parameter.

The action types are static variables of the `TableActions` class. The name of these variables is listed below each action creator's name in **bold**.

## Items

### `setItems`

**SET_ITEMS**

Replaces the items<br/>Clears the selection<br/>Goes to the first page<br/>Sets loading to false<br/>Clears the error<br/>Sets the first row as active and pivot

Parameters:

1. `items` *object*[]

   The new items


### `addItems`

**ADD_ITEMS**

Adds the given items<br/>Clears the previous selection and selects the newly added items, **even those that may not be shown**

Parameters:

1. `items` ...*object*

   The items to add

### `deleteItems`

**DELETE_ITEMS**

Deletes the items with the given values<br/>Clears the selection

Parameters:

1. `values` *any*[]

   The values of the items to delete

### `setItemValues`

**SET_ITEM_VALUES**

Updates the value property of each given item<br/>Updates the selection to keep the same rows selected

Parameters:

1. `map` *object*

   The keys should be the old item values, and the values should be the new ones

### `patchItems`

**PATCH_ITEMS**

Applies the given patches to the matching items (found by the patch's value property)

Parameters:

1. `patches` ...*object*

   Will be `Object.assign`-ed to the destination item

### `sortItems`

**SORT_ITEMS**

Toggles the sort order for `path` between ascending, descending and disabled

Parameters:

1. `path` *string*

   The path of the property to sort the items by

2. `shiftKey` *boolean*

   **Default:** `false`<br/>Whether the previous sorting paths will be kept (if allowed)

### `setItemFilter`

**SET_ITEM_FILTER**

Clears the selection<br/>Sets the item filter

Parameters:

1. `filter` *any*

   The new item filter

### `clearItems`

**CLEAR_ITEMS**

Clears the items and the selection<br/>Goes to the first page<br/>Sets loading to false<br/>Clears the error<br/>

Parameters: none



## Display

### `startLoading`

**START_LOADING**

Sets loading to true<br/>

Parameters: none

### `setError`

**SET_ERROR**

Sets the error<br/>Sets loading to false<br/>

Parameters:

1. `error` *any*

   The new error



## Selection

### `select`

**SELECT**

Goes to the page where the given index is<br/>Updates the selection, active row, and pivot row

Parameters:

1. `index` *number*

   The index of the row in the [item array][] to select

2. `ctrlKey` *boolean*

   **Default:** `false`<br/>Whether the previous selection will be kept (if allowed)

3. `shiftKey` *boolean*

   **Default:** `false`<br/>Whether a range will be selected (if allowed)

### `clearSelection`

**CLEAR_SELECTION**

Clears the selection

Parameters: none

### `setSelected`

**SET_SELECTED**

Adds or removes the given values from the selection (if allowed)<br/>Optionally sets the active row and the pivot row

Parameters:

1. `map` *object*

   The keys should be the item values, and the values: true to select, and false to deselect

2. `active` *number*

   **Default:** `null`<br/>The index of the row in the [item array][] to be set as active (has no effect when null)

3. `pivot` *number*

   **Default:** `null`<br/>The index of the row in the [item array][] to be set as pivot (has no effect when null)

### `selectAll`

**SELECT_ALL**

Selects all visible items

Parameters: none

### `setActive`

**SET_ACTIVE**

Sets the active and pivot row<br/>Goes to the page where the given index is

Parameters:

1. `index` *number*

   The index of the row in the [item array][] to set as active and pivot

### `contextMenu`

**CONTEXT_MENU**

Updates the selection and active row

Parameters:

1. `index` *number*

   The index of the row in the [item array][] that was right-clicked on

2. `ctrlKey` *boolean*

   **Default:** `false`<br/>Whether the selection and active row will be left alone



## Pagination

### `setPageSize`

**SET_PAGE_SIZE**

Sets the page size

Parameters:

* `size` *number*

  The maximum number of rows allowed in a page

### `goToPage`

**GO_TO_PAGE**

Goes to the given page

Parameters:

* `page` *number*

  The new page number



[item array]: ./state.md#tableitems-object
