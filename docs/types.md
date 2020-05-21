### Column *object*

> **Used in**: [`columns`](#columns)
>

#### `title` *string*

This text will be displayed in the header.

#### `path` *string*

The property value of each row at `path` will be resolved and passed to the [`render`](#render-function) method as the first parameter, followed by the complete row object as the second one. If `path` is not set, the first parameter will be undefined. 

Columns that specify a `path`, are sortable. If that is not desirable (for example on images), you should not specify a `path` and resolve the property inside the `render` method.

If you don't set the `path` property, you must set the [`key`](#key-string) property instead.

#### `render`  *function*

Called for each cell to return the content to be displayed. For parameters, see [`path`](#path-string).

#### `key` *string*

Used for the generation of the react `key` properties for the cells. Must be unique for each column.

If [`path`](#path-string) is set, you needn't set the `key` property, as `path` will be used for the same purpose.

#### `isHeader` *boolean*

If set to true, a th element will be used instead of td for the cell rendering.



### Options *object*

> **Used in**:
>
> * **Table**: [`initTable`/`useTable`](./table.md#setup) methods
> * **TableCore**: [`createTable`](#reducer) method

#### `valueProperty` *string*

> **Default**: `'_id'`

Property path that contains a unique value for each item (ex. `_id`). 

#### `scrollX` *boolean*

> **Default**: `false`

If set to true, columns are allowed to overflow their container horizontally. A scrollbar will appear if they do.

Also, a column resizer will be added to the last column.

#### `isMultiselect` *boolean*

> **Default**: `true`

If set to false, the following features are disabled:

* `Shift`+ `Home`/`End`/`Up`/`Down`
* `Ctrl`/`Shift`  + `Click`
* `Ctrl` + `A`
* Drag selection.

#### `isListbox` *boolean*

> **Default**: `false`

If set to true:

* Clicking on empty space below the items won't clear the selection.
* Right clicking won't select the row below the cursor, it will just be set to active.
* The [active value](./core.md#activevalue-any) will be passed to [`onContextMenu`](#oncontextmenu) instead of the [selected values](./core.md#selectedvalues-array-of-any).
* Drag selection is disabled.

#### `minColumnWidth` *number*

> **Default**: `3`
>

The minimum column width percentage relative to the table width.

#### `itemParser` _Function_

> **Returns:** *object*
>
> **Default**: `item => item`

| Parameter | Type     | Description         |
| --------- | -------- | ------------------- |
| `item`    | *Object* | Table item to parse |

Called for each row before adding it to the table. Returns the modified row.

#### `itemPredicate` _Function_

> **Returns**: *boolean*
>
> **Default**: 
>
> ```javascript
> (item, filter) => {
>     if (!filter) return true;
> 
>     for (let key in filter) {
>        if (item[key] !== filter[key])
>           return false;
>     }
> 
>     return true;
> }
> ```

| Parameter | Type     | Description             |
| --------- | -------- | ----------------------- |
| `item`    | *Object* | Table item to filter    |
| `filter`  | *Any*    | See [`filter`](#filter) |

Called for each row to decide whether it should be displayed.

Note: The items will be [parsed](#itemparser-function) before being filtered.



## Lookup table

### `filter`

**Table**: [`filter`](./table.md#filter-any) component prop

**TableCore**: [`filter`](./core.md#filter-any) state property

### `onContextMenu`

**Table**: [`onContextMenu`](./table.md#onContextMenu-function) component prop

**TableCore**: [`onContextMenu`](./core.md#onContextMenu-function) component prop

### `columns`

**Table**: [`columns`](./table.md#columns-array-of-column) component prop

**TableCore**: [`columns`](./core.md#columns-array-of-column) component prop