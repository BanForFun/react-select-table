import React, { useCallback, useMemo, useRef } from 'react'
import _ from "lodash";
import { Table, getTableUtils, saveModules as allSaveModules, flagUtils } from 'react-select-table';
import comments from "../data/comments.json";
import { applyOptions, clearOptions, tableNamespace } from '../store'
import Checkbox from './common/Checkbox'
import { useSearchParams } from 'react-router-dom'

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
const { hooks, options, selectors } = utils

const logEvent = type =>
  (...args) => console.log(type, ...args);

function FullDemo() {
  const tableRef = useRef();

  const getState = hooks.useGetState()
  const actions = hooks.useActions()

  const [searchParams, setSearchParams] = useSearchParams({
    saveModules: allSaveModules.Items
  });

  const saveModules = useMemo(() =>
    parseInt(searchParams.get('saveModules')), [searchParams])

  const setSaveModules = useCallback(modules => {
    searchParams.set('saveModules', modules)
    setSearchParams(searchParams)
  }, [setSearchParams, searchParams])

  const handleTableKeyDown = useCallback((e, selection) => {
    switch(e.keyCode) {
      case 46: //Delete
        actions.deleteItems(...selection);
        break;
      default:
        break;
    }

  }, [actions]);

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
    <h2>Actions</h2>
    <h3>Items</h3>
    <div className="controls">
      <button onClick={() => actions.setItems(comments)}>Set items</button>
    </div>
    <h3>Pagination</h3>
    <div className="controls">
      <button onClick={() => actions.setPageSize(10)}>Set page size to 10</button>
      <button onClick={() => actions.setPageSize(0)}>Disable pagination</button>
    </div>

    <h2>Options</h2>
    <div className="controls">
      <button onClick={clearOptions}>Reset options</button>
      <div className="break"/>
      <Checkbox id="multiSelect"
                label="Multiple selection"
                checked={options.multiSelect}
                onChange={checked => applyOptions({ multiSelect: checked })} />
      <Checkbox id="listBox"
                label="ListBox mode"
                checked={options.listBox}
                onChange={checked => applyOptions({ listBox: checked })} />
    </div>
    <h3>Save state</h3>
    <div className="controls">
      {_.map(allSaveModules, (flag, name) =>
        <Checkbox key={`module_${name}`}
                  id={name}
                  label={name}
                  checked={flagUtils.hasFlag(saveModules, flag)}
                  onChange={checked => setSaveModules(
                    flagUtils.toggleFlag(saveModules, flag, checked, allSaveModules))}
        />)}
      <div className="break"/>
      <button onClick={() => applyOptions({
        savedState: selectors.getSaveState(getState(), saveModules)
      })}>Save state</button>
    </div>
  </>
}

export default FullDemo;
