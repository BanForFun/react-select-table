# Column

#### `title` *string*

This text will be displayed in the header.

#### `path` *string*

The property value of each row at this property will be resolved (using lodash `get`) and passed to the [`render`](#render-function) function as the first parameter, followed by the complete row object as the second one.

Columns that have this property are sortable. If that is not desirable (ex. for images and buttons), you should not set it and instead resolve the property manually inside the `render` function. In that case though, you should set the [`key`](#key-string) property.

#### `render`  *function*

Called for each cell to return the content to be displayed. If not set, the property at `path` will be rendered directly.

#### `key` *string*

Used in the generation of the [react key](](https://reactjs.org/docs/lists-and-keys.html#keys)) for the cells, so it must be unique for each column.

If [`path`](#path-string) is set, it will be implicitly used as the key. If multiple columns use the same path, then you should their keys to different ones.

#### `isHeader` *boolean*

If set to true, a `th` element will be used instead of the default `td`.

####  `className` *string*

This class name will be applied to the `td` or `th` element