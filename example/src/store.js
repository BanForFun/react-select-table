import {applyMiddleware, legacy_createStore as createStore} from "redux";
import {createTable, eventMiddleware} from "react-select-table";
import {composeWithDevTools} from "redux-devtools-extension";
import comments from "./data/comments.json";

export const tableNamespace = "comments";

const customOptions = JSON.parse(sessionStorage.getItem("options"))

export function applyOptions(options) {
  sessionStorage.setItem("options", JSON.stringify({
    ...customOptions,
    savedState: null,
    ...options
  }))
  window.location.reload()
}

export function clearOptions() {
  sessionStorage.removeItem("options")
  window.location.reload()
}

const reducer = createTable(tableNamespace, {
  keyBy: "id",
  searchProperty: "name",
  itemPredicate: (row, filter) => filter == null || row.name.startsWith(filter),
  savedState: {
    items: comments
  },
  ...customOptions,
});


export default createStore(reducer, composeWithDevTools(applyMiddleware(eventMiddleware)));
