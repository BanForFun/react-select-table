import { configureStore } from '@reduxjs/toolkit'
import { createTable, eventMiddleware, getTableUtils } from 'react-select-table'
import { getOptions } from './utils/customOptionsUtils'
import todos from './data/todos.json'
import _ from 'lodash'

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
if (_.isEmpty(utils.options.savedState)) {
  store.dispatch(utils.actions.setItems(todos))
  store.dispatch(utils.actions.sortItems('id'))
}

export default store
