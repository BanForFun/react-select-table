## Actions

The action creators are accessible from a `TableActions` instance. The constructor takes the table [namespace][namespace] as a parameter. The dispatched actions have a `namespace` property that contains the namespace that was passed to the constructor.

The action types are static variables of the `TableActions` class.

```javascript
import { TableActions } from "react-select-table";
const todoActions = new TableActions("todo");

//For example to set the table rows you can use
store.dispatch(todoActions.addRow({
    //New row
}))

//You can also access the action types
switch(action.type) {
    case TableActions.ADD_ROW:
        console.log(
            `New row in ${action.table} table`,
            action.payload.newItem
        );
        break;
}
```



### Rows

Below each action creator, the action type variable name is listed. The actual value is different.

#### `setRows`

> SET_ROWS

Parameters:

* `items` *object[]* | *object*
* `keyed` *boolean* (default `false`)

Set `keyed` to true if the items parameter is of type object and the items are already keyed by value.

Sets item list to `items`. Sets loading state to false.

#### `addRows`

> ADD_ROWS

Parameters:

* `...items` *object[]*

Adds `items` to the item list. If items with the same value exist, they will be overwritten.

#### `deleteRows`

> DELETE_ROWS

Parameters:

* `...values` *any[]*

Deletes all items who's values are included in `values`.

#### `patchRows`

> PATCH_ROWS

Parameters:

* `...patches` *object[]*

For each patch, if an item is found by the value property of the patch, the patch's properties are `Object.assign`-ed to it

**Warning**: Don't use `patchRow` to change an items' values, as the selection will not be updated. Use [`setRowValues`][setRowValues] instead.

#### `setRowValues`

> SET_ROW_VALUES

Parameters:

* `map` *object*

For each `map` key-value pair, if an item is found with its value equal to the key, its value is set to the corresponding value.

#### `clearRows`

> CLEAR_ROWS

Parameters: none

Removes all items. Sets loading to true. Sets error to null. Clears the selection.

#### `setRowValue`

> Calls [`setRowValues`][setRowValues] internally

Parameters:

* `oldValue` *any*
* `newValue` *any*

If an item is found with its value equal to `oldValue`, its value is set to `newValue`.

#### `patchRow`

> Calls [`patchRows`][patchRows] internally

Parameters:

* `patch` *object*

If an item is found by the value property of `patch`, the patch's properties are `Object.assign`-ed to it

#### `addRow`

> Calls [`addRows`][addRows] internally

Parameters:

* `item` object

Adds `item` to the item list. If an item with the same value exists, it will be overwritten.



### Selection

#### `selectRow`

> SELECT_ROW

Parameters:

* `value` *any*
* `ctrlKey` *boolean* (default `false`)
* `shiftKey` *boolean* (default `false`)

Modifies the selection based on the item that was clicked, and whether the `Ctrl ` and `Shift` keys were held down.

#### `contextMenu`

> CONTEXT_MENU

Parameters:

* `value` *any*
* `ctrlKey` *boolean*

Modifies the selection based on the item that was right-clicked, and whether the `Ctrl` key was held down.

#### `setActiveRow`

> SET_ACTIVE_ROW

Parameters:

* `value` *any*

Sets active value and pivot value to `value`.

#### `clearSelection`

> CLEAR_SELECTION

Parameters: none

Clears the active value. Clears the selection if the [list box][listBox] option is disabled.

#### `selectAll`

> SELECT_ALL

Parameters: none

Selects all items. Has no effect if the [multiple selection][multiSelect] option is disabled.

#### `setRowSelected`

> SET_ROW_SELECTED

Parameters:

* `value` *any*
* `selected` *boolean*

Finds the item by `value` and selects/de-selects it, based on `selected`.



### Presentation

#### `setFilter`

> SET_FILTER

Parameters:

* `filter` *any*

Sets the filter to `filter`. Updates the items.

#### `sortBy`

> SORT_BY

Parameters:

* `path` *string*
* `shiftKey` *boolean* (default `false`)

If not already sorting by `path`, the sort order is set to ascending. Otherwise it is toggled between ascending and descending.

If the [multiple sorting][multiSort] option is disabled or `shiftKey` is false, all previous sorting columns will be reset.

#### `setError`

> SET_ERROR

Parameters:

* `error` *any*

Sets error to `error`. Sets loading to false.



### Pagination

#### `setPageSize`

> SET_PAGE_SIZE

Parameters:

* `size` *number*

Sets the page size to `size`.  Sets the current page to the first one. Updates the items.

#### `goToPage`

> GO_TO_PAGE

Parameters:

* `index` *number*

Sets the current page to the nearest valid index to `index`. Updates the items based on the new page.

#### `nextPage`

> Calls [`goToPage`][goToPage] internally

Parameters: none

Increments the current page by one (when possible).

#### `previousPage`

> Calls [`goToPage`][goToPage] internally

Parameters: none

Decrements the current page by one (when possible).

#### `firstPage`

> Calls [`goToPage`][goToPage] internally

Parameters: none

Sets the current page to the first one.

#### `lastPage`

> Calls [`goToPage`][goToPage] internally

Parameters: none

Sets the current page to the last one.



[setRowValues]: #setrowvalues
[patchRows]: #patchrows
[addRows]: #addrows
[goToPage]: #gotopage



[namespace]: ./common.md#namespace-string



[listBox]: ./settings.md#listbox-boolean
[multiSelect]: ./settings.md#multiselect-boolean
[multiSort]: ./settings.md#multisort-boolean