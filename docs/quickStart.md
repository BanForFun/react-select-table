# Quick start guide

## Installation

```shell
# Npm
npm install react-select-table

# Yarn
yarn add react-select-table
```

## Importing the stylesheet
### With Css
In your `App.js`, at the top:
```javascript
import 'react-select-table/dist/index.css';
```

### Or with Sass
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
of each option in [optionsUtils.js](../src/utils/optionsUtils.js), but we'll go through the most important ones here.

Each row to be added to the table must be an object (you can't add plain strings),
and as is the case for the reducer, it must also be identified by a unique string or number,
which is called the **key** of the row. The key can be the id of the item in the database,
or an auto-incrementing number or uuid if no database is involved. In any case, the key of the row should be
able to be derived from the row object, and that is the job of the `keyBy` option.
If the key of a row is just a property inside the object, you can simply set the `keyBy` option to
a string being the path to that property. In more complex cases you can set it to a function that takes
a row object as an argument and returns the key of the row.

If a reducer isn't the root reducer, you must set the `statePath` option to a string being the path to the reducer.

Lastly you must apply the `eventMiddleware` middleware to enable events.

### Example

Say we're making a todo list, and our objects are of this format:
```typescript
interface Todo {
    userId: number;
    id: number;
    title: string;
    completed: boolean
}
```
We'll set `keyBy='id'`, and `searchProperty='title'` to enable searching by title.
We must also select a namespace for the reducer, let's say `todos`. Our completed code is:

```javascript
import { configureStore } from '@reduxjs/toolkit'
import { createTable, eventMiddleware } from 'react-select-table'

export const tableNamespace = 'todos';

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

export const tableNamespace = 'todos';

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

## Using the component
