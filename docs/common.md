## Common usage

Applies to both `Table` and `TableCore`.

### Props

#### `columns` _Array_

> __Required__

Say for example that we want to render the items below:

```javascript
[
    {
        pet_id: 1,
        photo_url: "https://www.petsdb.gr/files/assets/images/lefki.jpg",
        name: "Lefki", 
        birth_date: "2019-04-03"
    }
]
```

For displaying text, the column object should include the following properties. The property value at `path` is resolved and rendered. The `title` string is displayed on the header.

```javascript
{
    title: "Name",
    path: "name"
}
```

We can set the `isHeader` property to true, so that a `th` element is used instead of `td`.

```javascript
{
    title: "Id",
    path: "pet_id",
    isHeader: true
}
```

To render custom content, we can use the `render` property. In this example we use it to format a date string.

The `render` method is called with two parameters: 

1. The item's property value at `path`  
2. The whole item

It can return either a component or (in this case) a string.

```javascript
{
    title: "Birth date",
    path: "birth_date",
    render: date => new Date(date).toLocaleDateString()
}
```

Columns that have a `path` property are sortable by default. To avoid this, we can use the `key` property instead. If `path` is not provided, the `render` method is called with the single parameter being the whole item. You have to get the property yourself inside the render method.

```javascript
{
    title: "Photo",
    key: "photo",
    render: pet => <img src={pet.photo_url} alt="Photo" />
}
```

#### `name` _String_

> __Required__

Used for the generation of the react `key` properties for the rows and columns.

#### `className` *String*

> **Default:** `""`

Compatible with styles designed for html table elements (for example bootstrap's `table` class).

#### `emptyPlaceholder` _Component_

> **Default**: `null`

Rendered when the table contains no items.

#### `onContextMenu` _Function_

> **Default**: `() => {}`

Called when the user right-clicks on a row or the table container.

| Parameter | Type    | Description                                                  |
| --------- | ------- | ------------------------------------------------------------ |
| `values`  | *Array* | If `isListbox` is false (default), the selected values.<br/>Otherwise, the active value in an array. |

#### `onItemsOpen` _Function_

> **Default**: `() => {}`

Called when the user double-clicks or presses the enter key. 

This event will not be raised if no rows are selected, meaning that `values` can never be empty.

| Parameter  | Type      | Description                                                  |
| ---------- | --------- | ------------------------------------------------------------ |
| `values`   | *Array*   | The selected values.                                         |
| `enterKey` | *Boolean* | True if caused by enter key press, false if caused by double click. |

#### `onSelectionChange` _Function_

> **Default**: `() => {}`

Called when the selection changes.

| Parameter | Type    | Description          |
| --------- | ------- | -------------------- |
| `values`  | *Array* | The selected values. |
