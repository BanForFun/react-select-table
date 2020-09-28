## State

#### `sortBy` *object*

> Default: `{}`
>
> Modified by: [`sortBy`][sortBy]

An object whose keys are the property paths to sort the items by, and keys are the order in which to sort them (`asc` for ascending, `desc` for descending).

If the [multiple sorting][multiSort] option is disabled (default), this object will only contain at most one key-value pair.

The items are [parsed][parser] before being sorted.

#### `selectedValues` *any[]*

> Default: `[]`
>
> Modified by: [`setRows`][setRows], [`deleteRows`][deleteRows], [`setRowValues`][setRowValues], [`clearRows`][clearRows], [`setFilter`][setFilter], [`selectRow`][selectRow], [`clearSelection`][clearSelection], [`setRowSelected`][setRowSelected], [`selectAll`][selectAll], [`contextMenu`][contextMenu]

The values of the selected items. By default, they have a light green background color.

#### `activeValue` *any*

> Default: `null`
>
> Modified by: [`setRows`][setRows], [`deleteRows`][deleteRows], [`setRowValues`][setRowValues], [`clearRows`][clearRows], [`setFilter`][setFilter], [`selectRow`][selectRow], [`clearSelection`][clearSelection], [`setActiveRow`][setActiveRow], [`contextMenu`][contextMenu]

The value of the active item. By default, it has a green bottom border.

#### `filter` *any*

> Default: `null`
>
> Modified by: [`setFilter`][setFilter]

Passed as the second argument to the [predicate][predicate] function.

#### `items` *object*

> Default: `{}`
>
> Modified by: [`setRows`][setRows], [`addRows`][addRows], [`deleteRows`][deleteRows], [`setRowValues`][setRowValues], [`patchRows`][patchRows], [`clearRows`][clearRows]

Unparsed, unsorted and unfiltered items keyed by value.

#### `pivotValue` *any*

> Default: `null`
>
> Modified by: [`clearRows`][clearRows], [`clearSelection`][clearSelection], [`selectRow`][selectRow], [`setActiveRow`][setActiveRow], [`contextMenu`][contextMenu]

The value of the item that is used to pivot the selection on `Shift`+`Click`/`Up`/`Down`/`Home`/`End`.

#### `tableItems` *object[]*

> Default: `[]`
>
> Modified by: [`setRows`][setRows], [`addRows`][addRows], [`deleteRows`][deleteRows], [`setRowValues`](#setRowValues), [`patchRows`][patchRows], [`clearRows`][clearRows], [`sortBy`][sortBy], [`setFilter`][setFilter]

[Parsed][parser], [sorted][sortBy] and [filtered][filter] items.

If an item has a `_className` property set to a class name string, it will be applied to the **tr** element.

#### `isLoading` *boolean*

> Default: `false`
>
> Modified by: [`setRows`][setRows], [`clearRows`][clearRows], [`setError`](#seterror)

Used to conditionally display a [loading indicator][loadingIndicator].

#### `pageSize` *number*

> Default: `0`
>
> Modified by: [`setPageSize`](#setpagesize)

The maximum number of items displayed on a page. If set to 0, pagination is disabled.

#### `currentPage` *number*

>  Default: `1`
>
>  Modified by: [`goToPage`](#gotopage) 

The current page index. Has no effect when [page size][pageSize] is 0.

**Warning**: The first page has an index of 1, not 0. If set to 0, all items are hidden.

#### `error` *any*

> Default: `null`
>
> Modified by: [`clearRows`][clearRows], [`setError`](#seterror), [`setRows`][setRows]

Used to conditionally display an [error message][renderError].



[options]: ./options.md
[multiSort]: ./options.md#multisort-boolean
[parser]: ./options.md#itemParser-function
[predicate]: ./options.md#itempredicate-function
[value]: ./options.md#valueproperty-string



[loadingIndicator]: ./common.md#loadingindicator-node
[renderError]: ./common.md#renderError-function



[pageSize]: #pagesize-number
[filter]: #filter-any
[sortBy]: #sortby-object



[createTable]: ./core.md#setup
[withTable]: ./table.md#setup



[goToPage]: ./actions.md#goToPage
[setPageIndex]: ./actions.md#setPageIndex
[clearRows]: ./actions.md#clearRows
[setFilter]: ./actions.md#setFilter
[patchRows]: ./actions.md#patchRows
[setRowValues]: ./actions.md#setRowValues
[deleteRows]: ./actions.md#deleteRows
[addRows]: ./actions.md#addRows
[setRows]: ./actions.md#setRows
[sortBy]: ./actions.md#sortBy
[selectRow]: ./actions.md#selectRow
[setActiveRow]: ./actions.md#setActiveRow
[clearSelection]: ./actions.md#clearSelection
[selectAll]: ./actions.md#selectAll
[setRowSelected]: ./actions.md#setRowSelected
[setError]: ./actions.md#setError
[contextMenu]: ./actions.md#contextMenu