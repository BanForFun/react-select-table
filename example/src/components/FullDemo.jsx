import React, { useCallback, useRef } from 'react'
import _ from "lodash";
import { Table, getTableUtils, saveModules, flagUtils } from 'react-select-table';
import { useDispatch } from 'react-redux';
import comments from "../data/comments.json";
import { setCustomOptions, tableNamespace } from '../store'
import Checkbox from './common/Checkbox'

const extraComments = comments.splice(0, 200);

const commentPatches = [{
  id: 201,
  name: "et Patched"
}, {
  id: 202,
  name: "Bla bla"
}, {
  id: 205,
  name: "12345"
}]

const commentPatchesByValue = {
  483: {
    id: "a"
  },
  259: {
    id: 365
  }
}

const columns = [
  {
    title: "A/I",
    isHeader: true,
    defaultWidth: 10
  },
  {
    title: "#",
    path: "id",
    isHeader: true,
    defaultWidth: 10
  },
  {
    title: "Post id",
    path: "postId",
    defaultWidth: 10
  },
  {
    title: "Name",
    path: "name",
    defaultWidth: 40,
    render: (name, comment, options) => {
      if (comment.highlighted)
        options.className="highlighted";

      return name;
    }
  },
  {
    title: "Email",
    path: "email",
    defaultWidth: 30,
    render: address => <a href={`mailto:${address}`}>{address}</a>
  }
];

const utils = getTableUtils(tableNamespace);
const { actions, options, hooks } = utils

document.title = `react-select-table (${options.title})`;

const buttonActions = {
  "Set items": actions.setItems(comments),
  "Clear items": actions.clearItems(),
  "Add items": actions.addItems(...extraComments),
  "Patch items": actions.patchItems(...commentPatches),
  "Patch items by value": actions.patchItemsByKey(commentPatchesByValue),

  "Set error": actions.setError("An error occurred"),
  "Clear error": actions.setError(null),

  "Set filter": actions.setItemFilter("et"),
  "Clear filter": actions.setItemFilter(""),

  "Page size 10": actions.setPageSize(10),
  "Disable pagination": actions.setPageSize(0),

  "Start loading": actions.startLoading(),

  "Highlight items": actions.patchItems(
    { id: 11, highlighted: true },
    { id: 19, highlighted: true }
  )
};

const logEvent = type =>
  (...args) => console.log(type, ...args);

function FullDemo() {
  const dispatch = useDispatch();

  const tableRef = useRef();

  const getSaveState = hooks.useSelectorGetter(utils.getSaveState)

  const handleActionClick = useCallback(action => {
    dispatch(action);
    tableRef.current.focus();
  }, [dispatch]);

  const handleTableKeyDown = useCallback((e, selection) => {
    switch(e.keyCode) {
      case 46: //Delete
        dispatch(actions.deleteItems(...selection));
        break;
      default:
        break;
    }

  }, [dispatch]);

  return <>
    <Table
      ref={tableRef}
      emptyPlaceholder="No items"
      namespace={tableNamespace}
      columnOrder={[0, 1, 3, 4]}
      columns={columns}
      loadingIndicator="Loading..."
      autoFocus={true}
      onKeyDown={handleTableKeyDown}
      onContextMenu={logEvent("Context menu")}
      onColumnResizeEnd={logEvent("Columns Resized")}
      onSelectionChange={logEvent("Selection")}
      onItemsOpen={logEvent("Open")}
    />
    <div id="buttons">
      {_.map(buttonActions, (action, name) =>
        <button key={`action_${name}`} onClick={() => handleActionClick(action)}>{name}</button>)}

      <br/>
      {_.map(saveModules, (flag, name) =>
        <Checkbox key={`module_${name}`}
                  id={name}
                  label={name}
                  checked={flagUtils.hasFlag(options.saveModules, flag)}
                  onChange={checked => setCustomOptions({
                    saveModules: flagUtils.toggleFlag(options.saveModules, flag, checked, saveModules)
                  })}
        />)}
      <button onClick={() => setCustomOptions({ savedState: getSaveState() })}>Save state</button>
    </div>
  </>
}

export default FullDemo;
