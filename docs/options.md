### Options

The default options can be modified using [`setDefaultOptions`][setDefaultOptions].

#### `valueProperty` *string*

> Default: `'id'`

Property path that contains a unique value for each item

#### `initItems` *object[]*

> Default: `[]`

Initial items state (before parsing, sorting and filtering)

#### `scrollX` *boolean*

> Default: `false`

If set to true:

* Columns are allowed to overflow their container horizontally. A scrollbar will appear if they do.
* A column resizer will be added to the last column.

#### `multiSelect` *boolean*

> Default: `true`

If set to false, the following features are disabled:

* `Ctrl`/`Shift` + `Click`/`Home`/`End`/`Up`/`Down`
* `Ctrl` + `A`
* Drag selection

#### `listBox` *boolean*

> Default: `false`

If set to true:

* Clicking on empty space below the items won't clear the selection.
* Right clicking a row won't select it, it will just be set to active.
* Drag selection is disabled.

#### `multiSort` *boolean*

>  Default: `false`

If set to true, the user can shift-click on column headers to sort the items based on multiple columns.

#### `minColumnWidth` *number*

> Default: `3`

The minimum column width percentage relative to the table width.

#### `path` *string*

> Default: `null`

If the table reducer isn't the root, you can set the path where the table reducer is located. The path is resolved using lodash's `_.get` method, meaning that dot notation can be used. If the table reducer is the root, you can leave it set to `null`.

#### `initState` *object*

The initial redux state. The available properties and their default values can be found [here][state]

#### `itemParser` _function_

> Returns: *object*
>
> Default: `item => item`

| Parameter | Type     | Description   |
| --------- | -------- | ------------- |
| `item`    | *object* | Item to parse |

Called for each row before adding it to the table. Must return a new row. DO **NOT** MUTATE `item`

#### `itemPredicate` _function_

> Returns: *boolean*
>
> Default:
>
> ```javascript
> (item, filter) => {
>    if (!filter) return true;
> 
>    for (let key in filter) {
>       if (item[key] !== filter[key])
>          return false;
>    }
> 
>    return true;
> }
> ```

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| `item`    | *object* | Item to filter             |
| `filter`  | *any*    | The table [filter][filter] |

Called for each row to decide whether it should be displayed. The items are [parsed][parser] before being filtered.

With the default implementation, the filter can contain key-value pairs of property paths and matching values. For example, the filter:

```javascript
{
    id: "1",
    title: "react-select-table",
    author: "BanForFun"
}
```

...will only allow rows that have a `title` property set to `"react-select-table"` and an `author` property set to `"BanForFun"`. Any extra properties (like `id` in this instance) will be ignored.



[setDefaultOptions]: ./utils.md#setdefaultoptions



[state]: ./state.md
[filter]: ./state.md#filter-any


[parser]: #itemparser-function