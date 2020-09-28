## TableCore usage

### Setup

To create a reducer, use the `createTable` function.

Parameters:

* `namespace` *string*
* `options` *[Options][options]*

The `namespace` must match the component's [namespace][namespace]

**reducer.js**

```javascript
import { combineReducers } from "redux";
import { createTable, TableActions } from "react-select-table";

export const todosNs = "todos";

export const todoActions = new TableActions(todoNs);

const rootReducer = combineReducers({
    //...Other reducers
    todoTable: createTable(todosNs, {
        valueProperty: "id",
        listBox: true,
        path: "todoTable",
        initState: {
            pageSize: 10
        }
    })
})

export default rootReducer;
```

**store.js**

In order for events to function, you must apply the `eventMiddleware` middleware.

```javascript
import { createStore, applyMiddleware } from "redux";
import { eventMiddleware } from "react-select-table";
import rootReducer from "./reducer";

export default createStore(rootReducer, applyMiddleware(eventMiddleware));
```

**TodoTable.jsx**

```javascript
import React, { useEffect } from "react";
import { useDispatch, ReactReduxContext } from "react-redux";
import { TableCore } from "react-select-table";
import { todoNs, todoActions as actions } from "./reducer.js";

const columns = [...]

function TodoTable() {
    const dispatch = useDispatch();

    useEffect(() => {
        //getTodos could be an async function that returns an array
        getTodos().then(todos => dispatch(actions.setRows(todos)));
    }, [dispatch]);

    return (
    	<TableCore
            name={todoNs}
            context={ReactReduxContext}
            columns={columns}
        />
    )
}


export default TodoTable;
```

**App.js**

```javascript
import React from "react";
import { Provider } from "react-redux";
import store from "./store";
import TodoTable from "./TodoTable";

function App() {
    return <Provider store={store}>
        <TodoTable />
    </Provider>
}

export default App;
```



### Selectors

Here is an example of how to use of the `makeGetPageCount` selector in combination with [`getTableSlice`][getSlice] to get the page count (continuing from the reducer example above):

**Pagination.jsx**

```javascript
import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { makeGetPageCount, getTableSlice } from "react-select-table";
import { todoNs, todoActions as actions } from "./reducer";

function Pagination() {
    const getPageCount = useMemo(makeGetPageCount, []);
    
    const tableState = useSelector(s => getTableSlice(s, todoNs))
    const pageCount = useSelector(() => getPageCount(tableState));

    const dispatch = useDispatch();
    
    const handleNextClick = useCallback(e => {
        dispatch(actions.nextPage());
    }, [dispatch]);
    
    //Rest of component
}

export default Pagination;
```

#### `makeGetPageCount`

Creates a state selector that returns the page count.



### Component props

**All [common props][commonProps] plus:**

#### `context` *any*

> Required

Your react-redux context. You can import the default one using:

```javascript
import { ReactReduxContext } from "react-redux";
```



#### `namespace` *string*

Used to differentiate the actions dispatched by each table. If not set, the table's [name][name] will be used for the namespace.

If you have two or more tables that you want controlling a common reducer, you can set this property to the namespace you passed to [`createTable`][setup]. Then you can set the table names to unique values, and their actions will be handled by a common reducer.



#### `renderError` *function*

Arguments:

| Type  | Description              |
| ----- | ------------------------ |
| *any* | The [error][error] state |

Called when the error state isn't null. It must return a node to be rendered. By default, the error will be rendered as is



[ commonProps ]: ./common.md#component-props
[name]: ./common.md#name-string



[error]: ./state.md#error-any



[options]: ./options.md



[namespace]: #namespace-string
[setup]: #setup



[getSlice]: ./utils.md#gettableslice

