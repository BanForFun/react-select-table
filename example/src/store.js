import {applyMiddleware, legacy_createStore as createStore} from "redux";
import {createTable, eventMiddleware} from "react-select-table";
import {composeWithDevTools} from "redux-devtools-extension";
import _ from "lodash"

export const tableNamespace = "comments";

const compose = composeWithDevTools({
  // serialize: false
});

const customOptions = JSON.parse(sessionStorage.getItem("options"))
if (!customOptions)
  setCustomOptions({ title: "Default" })

export function setCustomOptions(options) {
  _.defaults(options, customOptions)
  sessionStorage.setItem("options", JSON.stringify(options))
  window.location.reload()
}

const reducer = createTable(tableNamespace, {
  keyBy: "id",
  searchProperty: "name",
  constantWidth: false,
  multiSelect: true,
  listBox: false,
  itemPredicate: (row, filter) => filter == null || row.name.startsWith(filter),
  ...customOptions
});


export default createStore(reducer, compose(applyMiddleware(eventMiddleware)));
