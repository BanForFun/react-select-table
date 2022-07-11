import { configureStore } from '@reduxjs/toolkit'
import { createTable, eventMiddleware } from 'react-select-table'
import { getOptions } from './utils/customOptionsUtils'
import todos from './data/todos.json'

export const tableNamespace = "todos";

const reducer = createTable(tableNamespace, {
  keyBy: "id",
  searchProperty: "title",
  savedState: {
    items: todos,
    sortAscending: {
      id: false
    }
  },
  ...getOptions()
});

export default configureStore({
  reducer,
  middleware: [eventMiddleware]
})
