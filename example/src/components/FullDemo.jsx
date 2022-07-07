import React, { Fragment, useCallback, useMemo, useRef, useState } from 'react'
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
import { applyOptions } from '../utils/customOptionsUtils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import usePersistState from '../hooks/usePersistState'
import { Slide, toast, ToastContainer } from 'react-toastify'

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

const utils = getTableUtils(tableNamespace);
const { hooks, options, selectors } = utils

function eventArgToString(arg) {
  if (arg instanceof Set)
    return [...arg].toString()

  return arg.toString()
}

function logEvent(title, args = {}) {
  const content = <div style={{ whiteSpace: "nowrap" }}>
    <b>{title}</b>
    {_.map(args, (arg, name) => <Fragment key={name}>
      <br/>{name}: {eventArgToString(arg)}
    </Fragment>)}
  </div>

  if (toast.isActive(title))
    return toast.update(title, { render: content })

  toast.info(content, { toastId: title })
}

function FullDemo() {
  const tableRef = useRef();

  const getState = hooks.useGetState()
  const actions = hooks.useActions()

  const persistSaveModules = usePersistState('saveModules', allSaveModules.Items)
  const [saveModules, setSaveModules] = useState(persistSaveModules.restoredValue)
  persistSaveModules.useUpdatedValue(saveModules)

  const persistColumnVisibility = usePersistState('columnVisibility', {})
  const [columnVisibility, setColumnVisibility] = useState(persistColumnVisibility.restoredValue)
  persistColumnVisibility.useUpdatedValue(columnVisibility)

  const persistColumnWidths = usePersistState('columnWidths', {})

  const orderedColumns = useMemo(() => {
    const orderedColumns = []
    for (const column of columns) {
      if (columnVisibility[column.title] === false) continue
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
    <ToastContainer transition={Slide} position='bottom-right' newestOnTop={true}/>

    <Table
      ref={tableRef}
      emptyPlaceholder="No items"
      namespace={tableNamespace}
      columns={orderedColumns}
      loadingIndicator="Loading..."
      autoFocus={true}
      initColumnWidths={persistColumnWidths.restoredValue}
      onKeyDown={handleTableKeyDown}
      onContextMenu={target =>
        logEvent("Context menu", { target })}
      onSelectionChange={selection =>
        logEvent("Selection changed", { selection })}
      onItemsOpen={(selection, fromKeyboard) =>
        logEvent("Items opened",  { selection, fromKeyboard })}
      onColumnResizeEnd={widths => {
        logEvent("Columns resized")
        persistColumnWidths.saveValue(widths)
      }}
    />

    <h2>Save state</h2>
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

    <h2>Columns</h2>
    <div className="controls">
    {_.map(columns, ({title}) =>
      <Checkbox id={`${title}_visibility`}
                key={title}
                label={title}
                checked={columnVisibility[title] !== false} //It should be checked when undefined
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
      <Checkbox id="multiSelect"
                label="Multiple selection"
                checked={options.multiSelect}
                onChange={checked => applyOptions({ multiSelect: checked })} />
      <Checkbox id="listBox"
                label="ListBox mode"
                checked={options.listBox}
                onChange={checked => applyOptions({ listBox: checked })} />
      <Checkbox id="constantWidth"
                label="Keep table width constant"
                checked={options.constantWidth}
                onChange={checked => applyOptions({ constantWidth: checked })} />
    </div>
  </>
}

export default FullDemo;
