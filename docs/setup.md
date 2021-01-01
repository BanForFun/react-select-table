# Setup

## Store

To create a table reducer, import and call the `createTable` function. It takes two parameters:

1. The table namespace

   A string you will later use to connect the component to the redux store. It must be different for every reducer. I recommend storing it in an exported variable to avoid typos, as you will use it in many places

2. [Options](./options.md)

Here are some examples of store setups (`store.js`):

**Single table**

```javascript
import {applyMiddleware, createStore} from "redux";
import {ReactReduxContext} from "react-redux";
import {createTable, eventMiddleware} from "react-select-table";

export const tableNamespace = "todos";

const reducer = createTable(tableNamespace, {
    multiSelect: false,
    context: ReactReduxContext
});

export default createStore(reducer, applyMiddleware(eventMiddleware));
```

**Multiple tables with default options and redux devtools**

```javascript
import {applyMiddleware, createStore, combineReducers} from "redux";
import {ReactReduxContext} from "react-redux";
import {createTable, eventMiddleware, setDefaultTableOptions} from "react-select-table";
import {composeWithDevTools} from "redux-devtools-extension";

//To avoid having to pass the context to each table seperatly, you can set it as default.
//This must be done before any call to createTable
setDefaultTableOptions({
    context: ReactReduxContext
});

export const todosNamespace = "todos";
export const categoriesNamespace = "categories";

const reducer = combineReducers({
    tables: {
        todos: createTable(todosNamespace, {
            multiSelect: false,
            path: "tables.todos" //You must pass a path, if the table reducer isn't the root
        }),
        categories: createTable(categoriesNamespace, {
            listBox: true,
            path: "tables.categories"
        })
    }
});

//Set serialize to true to properly display selection Set
const compose = composeWithDevTools({ serialize: true });

export default createStore(reducer, compose(applyMiddleware(eventMiddleware)));
```

## Provider

Example index file (normally `index.js`)

```javascript
import './index.css'

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

//Import the store before the App component, so that you can use getTableUtils
import store from './store'
import App from './App'

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
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-select-table/dist/index.css';
import './App.css';

import 'bootstrap';
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

