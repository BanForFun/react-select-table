import { configureStore } from '@reduxjs/toolkit'
import { createTable, getTableUtils, SortOrders } from 'react-select-table'
import { getOptions } from './utils/customOptionsUtils'
import todos from './data/todos.json'
import _ from 'lodash'

export const tableNamespace = "todos";

const store = configureStore({
  reducer: createTable(tableNamespace, {
    keyBy: "id",
    searchProperty: "title",
    ...getOptions()
  })
})

const utils = getTableUtils(tableNamespace)
if (_.isEmpty(utils.options.savedState)) {
  store.dispatch(utils.actions.setItems(todos))
  store.dispatch(utils.actions.sortItems('id', false, SortOrders.Ascending))
}

export default store
