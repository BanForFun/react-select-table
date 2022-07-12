# react-select-table

A combination of item management (addition, deletion, sorting, etc.) using redux,
and a table component to display them.

## [Demo](https://banforfun.github.io/react-select-table/)
[Demo source code](./example/src)

## Features

* Item filtering
* Item searching (by just starting to type the first letters of the item)
* Multi-column sorting
* Pagination
* Resizable columns (widths can be saved and restored)
* Percentage based column sizing (can be used in resizable containers)
* Responsive column visibility
* Sticky header
* Performance optimized drag selection with automatic scrolling (even with uneven in height rows)
* Familiar shortcuts and selection behavior emulating native windows ListView
* Fully usable with only the keyboard
* Single and multi-row selection
* ListBox mode (explained below)
* Touch support (chromium based browsers only)
* Events (Selection changed, Columns resized, Items opened, Context menu)
* Modular state saving and restoring (ex. the items can be saved but not the sort order)
* Does not need margin for columns to be resized beyond the visible bounds
* Does not need margin for drag selecting beyond the visible bounds
* Easily customizable appearance using css variables (sass not required)

## Keyboard and mouse shortcuts

### Item selection
* **Up / Down** to select the previous/next item relative to the active item
* **Home / End** to select the first/last item
* **Ctrl + Any of the above** to set as active instead of select
* **Click** to select the item below the cursor
* **Left / Right** to set the row with the same index on the previous/next page active
* **Shift + Any of the above** to select all items in between
* **Shift + Click below rows** to select all items to the end of the page
* **Ctrl + Shift + Any of the above** to add to the previous selection instead of replacing it
* **Double click** to raise an items open event for the selected rows
* **Click below rows** to clear the selection
* **Enter** to select the active row if it's not selected, or to raise an items open event if it is selected
* **Ctrl + Enter** to toggle selection of the active row
* **Ctrl + Click** to toggle selection of the row below the cursor
* **Ctrl + A** to select all items
* **Right click** to raise a context menu event for the selected rows (also changes the selection in the same way a left click does, except if the row under the cursor is already selected)
* **Alt + Right click** to raise a context menu event for an empty selection, but without changing the selection
* **Alt + Ctrl + Right click** to raise a context menu event for the selected rows, without changing the selection
* **Ctrl + Right click below rows** to raise a context menu event for the selected rows, without clearing the selection
* **Shift + Right click** to bring up the browser's context menu
* **Click + Drag** to start drag selecting (you can also scroll while drag selecting)
* **Ctrl + Click + Drag** to add the drag selected rows to the previous selection instead of replacing it

### ListBox mode differences
* **Click below rows** does not clear the selection
* **Right click** to raise a context menu event for the active row (does not change the selection, but sets the row below the cursor active)
* **Right click below rows** to raise a context menu event for an undefined active row, but without clearing the active row
* **Alt + Right click** to raise a context menu event for an undefined active row, but without changing the active row
* **Alt + Ctrl + Right click** to raise a context menu event for the active row, without changing the active row
* **Ctrl + Right click** to raise a context menu event for the selected rows, without changing the selection

### Column resizing
* **Click on the green column separator + Drag** to start resizing the column
* **Move the cursor outside the table while dragging** to start automatically scrolling
* **If the table is overflowing horizontally (aka the scrollbar is visible), scroll with the wheel while dragging** to expand or shrink the column

### Column sorting
* **Click on a header title** to toggle the sorting order for the column between ascending and descending
* **Shift + Click on a header title** to sort the items using this column after first sorting them with the previously selected columns (multiple column sorting)

### Searching
* **Type any character while the table is focused** to bring up the search dialog
* **Up/Down** to go to the previous/next match
* **Press escape** to close the search dialog

## Touch gestures

### Item selection
* **Tap** to select the row below the finger
* **Tap below the rows** to clear the selection
* **Double tap** to raise an items open event for the row below the finger
* **Two-finger tap with both fingers on the same row** to raise a context menu event for the selected rows (also changes the selection in the same way a simple tap does, except if the row is already selected)
* **Two-finger tap with both fingers below the rows** to clear the selection and raise a context menu event for the empty selection
* **Two-finger tap with both fingers on separate rows** to raise an items open event for the selected rows, without changing the selection
* **Long tap** to toggle selection of the row below the finger
* **Long tap + Drag with a second finger** to start drag selecting (you can also scroll with the second finger while drag selecting)

### ListBox mode differences
* **Tap below the rows** does not clear the selection
* **Two-finger tap with both fingers on the same row** to raise a context menu event for the active row (does not change the selection, but sets the row active)
* **Two-finger tap with both fingers below the rows** to raise a context menu event for an undefined active row, but without clearing the active row

### Column resizing
* **Tap on the green column separator + Drag** to start resizing the column
* **Move the finger outside the table while dragging** to start automatically scrolling
* **If the table is overflowing horizontally (aka the scrollbar is visible), scroll horizontally with a second finger anywhere on the table** to expand or shrink the column

### Column sorting
* **Tap on a header title** to toggle the sorting order for the column between ascending and descending
* **Long tap on a header title** to sort the items using this column after first sorting them with the previously selected columns (multiple column sorting)

## Migrating from v4
This version is a complete rewrite, treat it as a completely different library

# Quick start guide

## Installation

```shell
# Npm
npm install react-select-table

# Yarn
yarn add react-select-table
```

### Example

On every section there is example code given, if you want to follow along building the example
from an empty create-react-app, you'll also need these libraries:

```shell
# Npm
npm install @reduxjs/toolkit react-redux @fortawesome/fontawesome-svg-core @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons sass axios

# Yarn
yarn add @reduxjs/toolkit react-redux @fortawesome/fontawesome-svg-core @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons sass axios
```

## Importing the stylesheet
### With Css
In your `index.js`, at the top:
```javascript
import 'react-select-table/dist/index.css';
```

### Or with Sass
**For the example code, we'll be using sass**

In your `App.js`, at the top:
```javascript
import './App.scss';
```

In `App.scss`:
```scss
@use '~react-select-table/src/scss/style' as rst;
```

## Setting up the store

Each table reducer is identified by a unique string, which is called the **namespace** of the reducer.
You will need it to dispatch actions for the reducer, to get state properties, and to pass it to the table component,
so it's a good idea to define it once, and export it to avoid typos.

To create a table reducer use the `createTable` function. It takes a namespace as the first argument,
and an object containing options as the second. You can see the default options as well as a description
of each option in [optionsUtils.js](./src/utils/optionsUtils.js), but we'll go through the most important ones here.

Each row to be added to the table must be an object (you can't add plain strings),
and as is the case for the reducer, it must also be identified by a unique string or number,
which is called the **key** of the row. The key can be the id of the item in the database,
or an auto-incrementing number or uuid if no database is involved. In any case, the key of the row should be
able to be derived from the row object, and that is the job of the `keyBy` option.
If the key of a row is just a property inside the object, you can simply set the `keyBy` option to
a string being the path to that property. In more complex cases you can set it to a function that takes
a row object as an argument and returns the key of the row.
Note that the key of the row is used internally as an object key,
meaning that the item key `1` is considered equal to `'1'`, and that whenever you receive keys from the library
(ex. the selected keys on the onSelectionChange event handler), they are in string form regardless of the original type.

If a reducer isn't the root reducer, you must set the `statePath` option to a string being the path to the reducer.

Lastly you must apply the `eventMiddleware` middleware to enable events.

### Example

Say we're making a todo list, and our objects are of this format:
```typescript
interface Todo {
    userId: number;
    id: number;
    title: string;
    completed: boolean;
}
```
We'll set `keyBy='id'`, and `searchProperty='title'` to enable searching by title.
We must also pick a namespace for the reducer, let's say `todos`. Our completed `store.js` code is:

```javascript
import { configureStore } from '@reduxjs/toolkit'
import { createTable, eventMiddleware } from 'react-select-table'

export const tableNamespace = 'todos'

export default configureStore({
  reducer: createTable(tableNamespace, {
    keyBy: 'id',
    searchProperty: 'title'
  }),
  middleware: [eventMiddleware]
})
```

In a typical app, where there other reducers as well, the code will look more like this:

```javascript
import { configureStore } from '@reduxjs/toolkit'
import { createTable, eventMiddleware } from 'react-select-table'

export const tableNamespace = 'todos'

export default configureStore({
  reducer: {
    todoTable: createTable(tableNamespace, {
      keyBy: 'id',
      searchProperty: 'title',
      statePath: 'todoTable'
    }),
    ...otherReducers
  },
  middleware: getDefault => getDefault().concat(eventMiddleware, ...otherMiddleware)
})
```

To complete the store setup, we need to add a store provider.

`index.js`
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { Provider } from 'react-redux'
import store from './store'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

## Adding the component

The component is exported as `Table`, and you can see the available props in [TableProps.js](./src/types/TableProps.js).

The first required prop is `namespace`, which should be the same one that you gave to the reducer.

The second required prop is `columns`, which should be an array of column objects.
You can see the properties of a column object also in [TableProps.js](./src/types/TableProps.js).
To set the title of the column, use the `title` property.
To specify how the content of the column is derived from a row object, you have three options:
1. If the content is derived from a single row property,
   you can set the `path` of the column to a string being the path to that property.
   If you stop here, the value of the row property will be displayed directly, but if you need more customization you
   can set the `render` of the column to a function that takes the value of the row property as an argument
   and returns the content to be displayed. Note that setting the `path` of the column, makes the column sortable.
2. If you don't set the `path`, the number of the row will be displayed in that column,
   or passed to the `render` function if provided.
3. If the content is derived from multiple row properties, you can leave the `path` unset,
   and use the second argument of the `render` function which is the entire row object,
   to derive and return the content.

There is also a third argument passed to `render`, which is an object with a `className` property which you can set
to give a custom class to the cell.

Columns are also identified by a unique string, called the **key** of the column.
By default, if `path` is set it is used as the key, but if it's not, or there are multiple columns with the same `path`,
you must set the `key` property of the column to a unique string.

You can set the `isHeader` property of the column to true, to use th elements instead of td.

Finally, you can optionally set the `defaultWidth` of the column to a number,
which is the percentage of the table width that should be taken up by the column on the initial render.

### Example

Continuing with the todo list example, we'll import the namespace from the store setup file.

We will then add our four columns:
1. The number of the row, with a title of 'A/I' (Auto increment)
2. The id of the item, with a title of 'Id', using th elements
3. The title of the item, with a title of 'Title'
4. The completion status of the item, with a title of 'Completed',
   rendered as a checkmark or an x icon, which is colored using a css class. We'll use fontawesome for the icons.

Our code thus far is:

`App.js`
```jsx
import './App.scss'

import React from 'react'
import { Table } from 'react-select-table'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'

import { tableNamespace } from './store'

const columns = [
  {
    title: "A/I",
    defaultWidth: 10
  },
  {
    title: "Id",
    path: "id",
    isHeader: true,
    defaultWidth: 10
  },
  {
    title: "Title",
    path: "title",
    defaultWidth: 50
  },
  {
    title: "Completed",
    path: "completed",
    defaultWidth: 20,
    render: (completed, todo, options) => {
      options.className = completed ? "text-green" : "text-red"
      return <FontAwesomeIcon icon={completed ? faCheck : faXmark}/>
    }
  }
];

export default function App() {
  return <div className="App">
    <Table columns={columns} namespace={tableNamespace} />
  </div>
}
```

`App.scss`
```scss
@use '~react-select-table/src/scss/style' as rst;

.App {
  height: 100vh;
  box-sizing: border-box;
  background-color: #f5f5f5;
  padding: 1rem 2rem;
}

.text-red {
  color: red;
}

.text-green {
  color: green;
}

```

## Dispatching actions

The action creators, state selectors, and hooks, are all packaged together in an object called utils.
Each table reducer has its own utils package, which you can access with the `getTableUtils` function.
This function takes the namespace of a reducer, and returns the utils for that reducer.

To dispatch an action outside a React component (ex. in middleware or a thunk action),
you can find the action creators in the `actions` property of the utils object.
See [Actions.js](./src/models/Actions.js) for the complete list of action creators and their descriptions.

To dispatch an action from inside a React component, there is the `useActions` hook.
The hooks can be found in the `hooks` property of the utils object.
The `useActions` hook returns an object containing the action creators, but already wrapped in a dispatch call.
Of course, you can still manually dispatch the raw action creators if you prefer.

Note: Some actions mutate the payload, so the payload you see in the developer tools may not be accurate

### Example

At this point, our table is pretty useless as it is empty, so we'll use axios to make an api request
to get some dummy todo items and add them to our table, showcasing some action creators in the process.

To get access to the `useActions` hooks, we need to import `getTableUtils`, call it with the table namespace,
and destructure the `hook` property from the returned object.

Then, in a useEffect hook, we use the `startLoading` action to show a loading indicator,
and then make a request to get the todo items. If the request succeeds, we use the `setItems` action to add them to
the table, and if it fails we use the `setError` action to display an error message.

So our final `App.js` code looks like this:

```jsx
import './App.scss'

import React, { useEffect } from 'react'
import { getTableUtils, Table } from 'react-select-table'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'

import { tableNamespace } from './store'

/* const columns = [
...
]; */

const { hooks } = getTableUtils(tableNamespace)

export default function App() {
  const actions = hooks.useActions()

  useEffect(() => {
    actions.startLoading()
    axios.get("https://jsonplaceholder.typicode.com/todos")
      .then(response => actions.setItems(response.data))
      .catch(() => actions.setError("Something went wrong"))
  }, [actions])

  return <div className="App">
    <Table columns={columns} namespace={tableNamespace} />
  </div>
}
```

To learn more, you can read [FullDemo.jsx](./example/src/components/FullDemo.jsx).
It's a continuation of this example todo list, but using all the library features.

## Customizing the appearance

Each table can take a custom className as a prop, and in such custom class you can set the values
of predefined variables to customize the appearance, blissfully unaware of the element structure.

### With Css
Every property that has to do with the appearance, is set to the value of a css variable.
To find the name of the variable that controls the property that you want to customize, you can use inspect element.

For example, the variable that controls the color of selected rows, when the table is focused, is
`--rst-row_selected_focused_background-color`, and you can set it to light blue using:
```css
.selection-blue {
  --rst-row_selected_focused_background-color: lightblue;
}
```

#### Fallback values

The naming convention for the css variables is `element_state1_..._stateN_property`,
and if the variable with that name is not defined or set to `unset`,
the properties that use that variable will fall back to the `element_state1_..._state(N-1)_property` variable,
recursively until the `element_property` variable.

For example, if you want to set the background color of the selected rows to light blue,
regardless if the table is focused or not, you can do it with:
```css
.selection-blue {
  --rst-row_selected_background-color: lightblue;
  --rst-row_selected_focused_background-color: unset;
}
```

#### Default appearance

To customize the default appearance, make sure that your stylesheet is imported after the library's,
and set the variables just like in the example above, but inside the `rst-container` class.

### With Sass

There are 2 things than can only be customized using sass: Whether the even or the odd rows are striped,
and the prefix of the css variables (`rst-` by default).

Another advantage is that you can use the shorthand form to customize a border
(with css only you must set the width, style, and color, separately).

The simplest way to customize the appearance is with the `load-config` mixin.
It takes a configuration map as an argument, and you can see all the keys
it can have in [_variables.scss](./src/scss/_variables.scss).

For example, the key that controls the border between the columns is `column.border`,
and you can set it to 4px thick solid gray as such:
```scss
.thick-border {
  @include rst.load-config((
    "column.border": 4px solid gray
  ))
}
```

#### Fallback values

The naming convention for the configuration keys is `element_state1_..._stateN.property`,
and if the key with that name is set to `unset`, the value of the `element_state1_..._state(N-1).property`
key will be used instead, recursively until the `element.property` key.
#### Default appearance

To customize the default appearance, you can pass a map like the one `load-config` takes,
to the `$config` variable, when importing the stylesheet.

For example, to set the default appearance to a dark-mode style, and set the stripe order to odd:
```scss
@use '~react-select-table/src/scss/style' as rst with (
  $stripe-order: odd,
  $config: (
    "head.background-color": #2c3034,
    "head.border-color": white,
    "head.color": white,
    "root-container.background-color": #212529,
    "body.color": white,
    "pg-page.color": white,
    "pg-page.border": 1px solid transparent,
    "pg-page_current.background-color": transparent,
    "pg-page_current.border-color": white
  )
)
```


## Hiding columns on smaller screens

In a column object, you can set the `key` property to a string.
Then you can use media queries to control the visibility of said column.
For example, say that your table has a className of `table-responsive`,
then to hide the column with the key `id` on screens smaller than 600px you can use:
```css
@media screen and (max-width: 600px) {
  .table-responsive [data-col-key=id] {
    width: 0 !important;
  }
}
```
