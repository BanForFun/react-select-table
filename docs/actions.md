# Actions

The action creators are accessible from a `TableActions` instance. The constructor takes the table [namespace][namespace] as the parameter.

The action types are static variables of the `TableActions` class.

## Action creators

Below each action creator, the action type static variable is listed. The actual value is different.

### Items

#### `setItems`

**SET_ITEMS**

Replaces the items inside the [items object][items]. Clears the [selection][selection]. Sets the [page][page] to 0. Sets [loading][loading] to false. Sets [error][error] to null. Sets the first row as [active][active] and [pivot][pivot].

Parameters:

1. `items` *object*[]

   The new items
   
#### `addItems`

**ADD_ITEMS**

Adds the items to the [items object][items]. Clears the previous [selection][selection] and selects the newly added items (**even those that may not be shown**).

Parameters:

1. `items` *object*[]

   The items to add

#### `deleteItems`

**DELETE_ITEMS**

Deletes the items from the [items object][items]. Clears the [selection][selection].

Parameters:

1. `values` *any*[]

   The values of the items to delete

#### `setItemValues`

**SET_ITEM_VALUES**

Updates the keys of the [items object][items] and the items' value properties. Updates the [selection][selection].

Parameters:

1. `map` *object*

   The keys should be the old item values, and the matching values should be the new item values

#### `patchItems`

**PATCH_ITEMS**

Patches the items inside the [items object][items]. 

Parameters:

1. `patches` ...*object*

   Each patch is assigned to the destination item, found by the patch's value property

#### `sortItems`

**SORT_ITEMS**



Parameters:

1. `patches` ...*object*

   Each patch is assigned to the destination item, found by the patch's value property


### Display



### Selection



### Pagination





[items]: ./state.md#items-object
[selection]: ./state.md#selection-set
[page]: ./state.md#pageIndex-number
[loading]: ./state.md#isLoading-boolean
[error]: ./state.md#error-any
[active]: ./state.md#activeIndex-number
[pivot]: ./state.md#pivotIndex-number