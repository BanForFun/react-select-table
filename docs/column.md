### Column *object*

#### `title` string

This text will be displayed in the header.

#### `path` string

The property value of each row at `path` will be resolved and passed to the [`render`](#render-function) function as the first parameter, followed by the complete row object as the second one. If `path` is not set, the first parameter will be undefined.

Columns that specify a `path`, are sortable. If that is not desirable (for example on images), you should not specify a `path` and resolve the property inside the `render` method.

If you don't set the `path` property, you must set the [`key`](#key-string) property instead.

#### `render`  function

Called for each cell to return the content to be displayed. For parameters, see [`path`](#path-string).

#### `key` *string*

Used for the generation of the react `key` properties for the cells. Must be unique for each column.

If [`path`](#path-string) is set, you needn't set the `key` property, as `path` will be used for the same purpose.

#### `isHeader` boolean

If set to true, a **th** element will be used instead of the default **td**.

####  `className` string

This class name will be applied to the **td** or **th** element