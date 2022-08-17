import { configureStore } from '@reduxjs/toolkit'
import { createTable, eventMiddleware, getTableUtils } from 'react-select-table'
import { getOptions } from './utils/customOptionsUtils'
import todos from './data/todos.json'

export const tableNamespace = "todos";

const reducer = createTable(tableNamespace, {
  keyBy: "id",
  searchProperty: "title",
  ...getOptions()
});

const store = configureStore({
  reducer,
  middleware: [eventMiddleware]
})

const utils = getTableUtils(tableNamespace)
if (!('savedState' in utils.options)) {
  store.dispatch(utils.actions.setItems(todos))
  store.dispatch(utils.actions.sortItems('id'))
}

export default store
