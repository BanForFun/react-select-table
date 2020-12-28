# Actions

The action creators are accessible from a `TableActions` instance. The constructor takes the table [namespace][namespace] as the parameter.

The action types are static variables of the `TableActions` class.

## Action creators

Below each action creator, the exported action type static variable name is listed. The actual value is different.

### Items

#### `setItems`

**SET_ITEMS**

Replaces the items<br/>Clears the selection<br/>Goes to the first page<br/>Sets loading to false<br/>Clears the error<br/>Sets the active index to 0<br/>Sets the pivot index to 0

Parameters:

1. `items` *object*[]

   The new items
   

#### `addItems`

**ADD_ITEMS**

Adds the given items<br/>Clears the previous selection and selects the newly added items, **even those that may not be shown**

Parameters:

1. `items` ...*object*

   The items to add

#### `deleteItems`

**DELETE_ITEMS**

Deletes the items with the given values<br/>Clears the selection

Parameters:

1. `values` *any*[]

   The values of the items to delete

#### `setItemValues`

**SET_ITEM_VALUES**

Updates the value property and key of each given item<br/>Updates the selection to keep the same rows selected

Parameters:

1. `map` *object*

   The keys should be the old item values, and the values should be the new ones

#### `patchItems`

**PATCH_ITEMS**

Applies the given patches to the matching items (found by the patch's value property)

Parameters:

1. `patches` ...*object*

   Will be `Object.assign`-ed to the destination item

#### `sortItems`

**SORT_ITEMS**

Toggles the sort order for `path` between ascending, descending and disabled

Parameters:

1. `path` *string*

   The path of the property to sort the items by
   
2. `shiftKey` *boolean* **false**

   Well...

#### `setItemFilter`

**SET_ITEM_FILTER**

Clears the selection<br/>Sets the [item filter][filter] to `filter`

Parameters:

1. `filter` *any*

   The new item filter

#### `clearItems`

**CLEAR_ITEMS**

Clears the [items object][items]<br/>Clears the [selection][]<br/>Sets the [page index][page] to 0<br/>Sets [loading][] to false<br/>Sets [error][] to null<br/>

Parameters: none



### Display

#### `startLoading`

**START_LOADING**

Sets [loading][] to true<br/>

Parameters: none

#### `setError`

**SET_ERROR**

Sets [loading][] to true<br/>Sets [error][] to `error`

Parameters:

1. `error` *any*

   The new error



### Selection

#### `select`

**SELECT**

Sets the [active index][active] to `index`<br/>Updates the [selection][] and [pivot index][pivot]

Parameters:

1. `index` *number*

   The index of the row to select in the [items array][tableItems]

2. `ctrlKey` *boolean* **false**

   Well...

3. `shiftKey` *boolean* **false**

   Well...

#### `clearSelection`

**CLEAR_SELECTION**

Clears the [selection][]

Parameters: none

#### `setSelected`

**SET_SELECTED**

Adds or removes the given values from the [selection][]<br/>Optionally sets the [active index][active] to `active`<br/>Optionally sets the [pivot index][] to `pivot`

Parameters:

1. `map` *object*

   The keys should be the item values, and the values should be a boolean indicating whether to select or deselect the items

2. `active` *number* **null**

   The new active index (has no effect when null)

3. `pivot` *number* **null**

   The new pivot index (has no effect when null)

#### `selectAll`

**SELECT_ALL**

Selects add items

### Pagination





[items]: ./state.md#items-object
[tableItems]: ./state.md#tableitems-object
[sortBy]: ./state.md#sortby-object
[selection]: ./state.md#selection-set
[page]: ./state.md#pageIndex-number
[loading]: ./state.md#isLoading-boolean
[error]: ./state.md#error-any
[active]: ./state.md#activeIndex-number
[pivot]: ./state.md#pivotIndex-number
[filter]: ./state.md#filter-any





[listBox]: ./options.md#listbox-boolean

[multiSelect]: ./options.md#multiselect-boolean