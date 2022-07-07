import React, { useCallback, useMemo, useRef, useState } from 'react'
import _ from "lodash";
import {
  Table,
  getTableUtils,
  saveModules as allSaveModules,
  flagUtils
} from 'react-select-table';
import todos from "../data/todos.json";
import { tableNamespace } from '../store'
import Checkbox from './common/Checkbox'
import Input from './common/Input'
import { applyOptions, clearOptions } from '../utils/customOptionsUtils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import usePersistState from '../hooks/usePersistState'

const columns = [
  {
    title: "A/I",
    defaultWidth: 10
    //A column without a 'path' property will display the number of the row
  },
  {
    title: "Id",
    path: "id",
    isHeader: true,
    defaultWidth: 10
  },
  {
    title: "Title",
    path: "title",
    defaultWidth: 50
  },
  {
    title: "Completed",
    path: "completed",
    defaultWidth: 20,
    render: (completed, todo, options) => {
      options.className = completed ? "text-green" : "text-red"
      return <FontAwesomeIcon icon={completed ? faCheck : faXmark}/>
    }
  }
];

const defaultColumnVisibility = _.zipObject(_.map(columns, "title"), _.map(columns, _.constant(true)))

const utils = getTableUtils(tableNamespace);
const { hooks, options, selectors } = utils

const logEvent = type =>
  (...args) => console.log(type, ...args);

function FullDemo() {
  const tableRef = useRef();

  const getState = hooks.useGetState()
  const actions = hooks.useActions()

  const persistSaveModules = usePersistState('saveModules', allSaveModules.Items)
  const [saveModules, setSaveModules] = useState(persistSaveModules.restoredValue)
  persistSaveModules.useSaveValue(saveModules)

  const persistColumnVisibility = usePersistState('columnVisibility', defaultColumnVisibility)
  const [columnVisibility, setColumnVisibility] = useState(persistColumnVisibility.restoredValue)
  persistColumnVisibility.useSaveValue(columnVisibility)

  const persistColumnWidths = usePersistState('columnWidths', {})

  const orderedColumns = useMemo(() => {
    const orderedColumns = []
    for (const column of columns) {
      if (!columnVisibility[column.title]) continue
      orderedColumns.push(column)
    }

    return orderedColumns
  }, [columnVisibility])

  const [pageSize, setPageSize] = useState(10)

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
      columns={orderedColumns}
      loadingIndicator="Loading..."
      autoFocus={true}
      initColumnWidths={persistColumnWidths.restoredValue}
      onKeyDown={handleTableKeyDown}
      onContextMenu={logEvent("Context menu")}
      onColumnResizeEnd={widths => {
        console.log("Columns resized", widths)
        persistColumnWidths.saveValue(widths)
      }}
      onSelectionChange={logEvent("Selection")}
      onItemsOpen={logEvent("Open")}
    />

    <h2>Columns</h2>
    <div className="controls">
    {_.map(columnVisibility, (visible, title) =>
      <Checkbox id={`${title}_visibility`}
                key={title}
                label={title}
                checked={visible}
                onChange={checked => setColumnVisibility(visibility => ({
                  ...visibility, [title]: checked
                }))} />
    )}
    </div>

    <h2>Actions</h2>
    <h3>Items</h3>
    <div className="controls">
      <button onClick={() => actions.setItems(todos)}>Set items</button>
    </div>
    <h3>Pagination</h3>
    <div className="controls">
      <Input id="pageSize"
             label="Page size"
             value={pageSize}
             onChange={setPageSize}
             type="number"
             style={{ width: "6ch" }}
             min="0" />
      <button onClick={() => actions.setPageSize(pageSize || 0)}>Apply</button>
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
      <div className="break"/>
      <Checkbox id="constantWidth"
                label="Keep table width constant"
                checked={options.constantWidth}
                onChange={checked => applyOptions({ constantWidth: checked })} />
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
