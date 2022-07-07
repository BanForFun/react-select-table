import { applyMiddleware, legacy_createStore as createStore } from 'redux'
import { createTable, eventMiddleware } from 'react-select-table'
import { composeWithDevTools } from 'redux-devtools-extension'
import { getOptions } from './utils/customOptionsUtils'
import todos from './data/todos.json'

export const tableNamespace = "todos";

const reducer = createTable(tableNamespace, {
  keyBy: "id",
  searchProperty: "title",
  itemPredicate: (row, filter) => filter == null || row.name.startsWith(filter),
  savedState: {
    items: todos
  },
  ...getOptions()
});


export default createStore(reducer, composeWithDevTools(applyMiddleware(eventMiddleware)));
