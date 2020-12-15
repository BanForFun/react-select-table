# Setup

## Store

To create a table reducer, import and call the `createTable` function. It takes two parameters:

1. The table namespace, which is a string you will later use to connect the component to the redux store. It must be different for every reducer.
2. An [options *object*](./options.md)

Here are some examples of store setups (`store.js`):

Single table

```javascript
import {applyMiddleware, createStore} from "redux";
import {createTable, eventMiddleware} from "react-select-table";

export const tableNamespace = "todos";

export default function setupStore() {
    const reducer = createTable(tableNamespace, {
		multiSelect: false
    });

    return createStore(reducer, applyMiddleware(eventMiddleware));
}
```

Single table with devtools

```javascript
import {applyMiddleware, createStore} from "redux";
import {createTable, eventMiddleware} from "react-select-table";
import {composeWithDevTools} from "redux-devtools-extension";

export const tableNamespace = "todos";

//In order to correctly display the selection property, serialize should be set to true
const compose = composeWithDevTools({ serialize: true });

export default function setupStore() {
    const reducer = createTable(tableNamespace, {
        multiSelect: false
    });

    return createStore(reducer, compose(applyMiddleware(eventMiddleware)));
}
```

Multiple nested tables

```javascript
import {applyMiddleware, createStore, combineReducers} from "redux";
import {createTable, eventMiddleware} from "react-select-table";

export const todoNamespace = "todos";
export const categoryNamespace = "categories";

export default function setupStore() {
    const todoReducer = createTable(todoNamespace, {
        multiSelect: false,
        path: "tables.todos"
    });

    const categoryReducer = createTable(categoryNamespace, {
       	listBox: true,
        path: "tables.categories"
    });

    const reducer = combineReducers({
        tables: {
            todos: todoReducer,
            categories: categoryReducer
        }
    });

    return createStore(reducer, applyMiddleware(eventMiddleware));
}
```

If you read the documentation for the options object, you will notice that in none of the examples above did we provide the required context option. You may also be wondering why we are exporting a function that returns the store and not the store directly. There is a reason for both of these, which we'll see in the provider setup below.

## Provider

To change the default options, you can import the `setDefaultOptions` function and call it BEFORE any call to `createTable`. It takes an *object* as an argument which will be `Object.assign`-ed to the internal default options object.

A good reason to do that, is to set the default context option, which in most apps will be the the same for all tables. Of course, you can set other default options while you're at it. Don't worry if you don't know what the redux context does, just import `ReactReduxContext` and pass it to `setDefaultOptions` like shown below.

Example index file (normally `index.js`)

```javascript
import './index.css'

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider, ReactReduxContext } from 'react-redux'
import { setDefaultOptions } from 'react-select-table'
import App from './App'
import setupStore from './store'

//Call setDefaultOptions BEFORE setupStore
setDefaultOptions({
    context: ReactReduxContext
});

const store = setupStore();

ReactDOM.render(
    <Provider store={store}>
   		<App />
    </Provider>,
    document.getElementById('root')
)
```

## Component

The component is exported as `Table`.  We'll need to pass it some [columns](./column.md) as well as the namespace which we used in the store setup. See all the available props [here](./component.md).

To set the items, we will use the `setItems` action creator. See all the action creators [here](./actions.md).

Be sure to import the stylesheet. We are also going to use the `table` class from bootstrap.

```javascript
import 'bootstrap';
import 'react-select-table/dist/index.css';
import './App.css';

import React, { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Table, TableActions } from 'react-select-table';
import { tableNamespace } from "./store";

const columns = [
    {
        title: "#",
        path: "id",
        isHeader: true
    },
    {
        title: "To do",
        path: "name"
    },
    {
        title: "Done",
        path: "done",
        render: isDone ? "Yes" : "no"
    }
]

//The action creators are accessible from a TableActions instance
const { setItems } = new TableActions(tableNamespace);

function App() {
    const dispatch = useDispatch();

    //Set initial items
    useEffect(() => {
    	dispatch(setItems([
            {
                id: "1",
                name: "Make coffee",
                done: true
            }, {
                id: "2",
                name: "Drink coffee",
                done: false
            }
        ]));
    }, [dispatch])

    return <Table
    	namespace={tableNamespace}
    	columns={columns}
    	className="table"
    />
}

export default App;
```

