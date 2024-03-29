import React, { useCallback, useMemo, useRef, useState } from 'react'
import _ from "lodash";
import { Table, getTableUtils, saveModules, flagUtils, setUtils } from 'react-select-table';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'

import Checkbox from './common/Checkbox'
import Input from './common/Input'

import useSessionState from '../hooks/useSessionState'
import useSessionValue from '../hooks/useSessionValue'

import { tableNamespace } from '../store'
import { applyOptions } from '../utils/customOptionsUtils'
import { eventToast } from '../utils/toastUtils'

import todos from "../data/todos.json";

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
      return <>
        <FontAwesomeIcon icon={completed ? faCheck : faXmark}/>
      </>
    }
  }
];

const { hooks, options, selectors } = getTableUtils(tableNamespace);

function FullDemo() {
  const tableRef = useRef();

  const getState = hooks.useGetState()
  const actions = hooks.useActions()

  const [savedModules, setSavedModules] = useSessionState('savedModules',
    saveModules.Items | saveModules.SortOrder)
  const [columnVisibility, setColumnVisibility] = useSessionState('columnVisibility', {})

  const [restoredColWidths, saveColWidths] = useSessionValue('columnWidths', {})

  const visibleColumns = useMemo(() =>
    columns.filter(c => columnVisibility[c.title] !== false),
    [columnVisibility])

  const [pageSize, setPageSize] = useState(10)
  const [chunkSize, setChunkSize] = useState(options.chunkSize)

  const handleTableKeyDown = useCallback((e, selection) => {
    switch(e.keyCode) {
      case 46: //Delete
        //Event argument for onKeyDown, onSelectionChange, onItemsOpen and onContextMenu
        //is a Set when the multiSelect option in enabled, or just the key of the row when it is disabled
        if (options.multiSelect)
          actions.deleteItems(...selection)
        else
          actions.deleteItems(selection)
        break;
      default:
        break;
    }

  }, [actions]);

  return <>
    <Table
      ref={tableRef}
      className="desktop-table"
      emptyPlaceholder="No items"
      namespace={tableNamespace}
      columns={visibleColumns}
      loadingIndicator="Loading..."
      autoFocus={true}
      initColumnWidths={restoredColWidths}
      onKeyDown={handleTableKeyDown}
      onContextMenu={target =>
        eventToast("Context menu", { target })}
      onSelectionChange={selection =>
        eventToast("Selection changed", { selection })}
      onItemsOpen={(selection, fromKeyboard) =>
        eventToast("Items opened",  { selection, fromKeyboard })}
      onColumnResizeEnd={widths => {
        eventToast("Columns resized and widths saved")
        saveColWidths(widths)
      }}
      onActionDispatched={internal => {
        if (internal) return
        tableRef.current.focus()
        window.scrollTo(0, 0)
      }}
    />

    <h2>Actions</h2>
    <h3>Items</h3>
    <div className="controls">
      <button onClick={() => actions.setItems(todos)}>Set items</button>
      <button onClick={() => actions.clearItems()}>Clear items</button>
      <button onClick={() => actions.setError("Something went wrong")}>Set error</button>
      <button onClick={() => actions.startLoading()}>Set loading</button>
      <button onClick={() => actions.replaceItems(todos.slice(0, 20))}>Replace items</button>
      <div className="break"/>

      <button onClick={() => {
        const selectedKeys = setUtils.getItems(getState().selected)
        const patch = _.zipObject(selectedKeys, selectedKeys.map(_.constant({ completed: true })))
        actions.patchItemsByKey(patch)
      }}>Set selected items completed</button>

      <button onClick={() => actions.patchItemsByKey({
        5: { id: 11 },
        11: { id: 5 }
      })}>Swap values of items 5 and 11</button>

      <button onClick={() => actions.patchItems(
        { id: 8, title: "Updated title" },
        { id: 9, completed: true }
      )}>Change title of item 8 and set 9 completed</button>

      <button onClick={() => actions.addItems(
        { id: 1, title: "Download react-select-table", completed: true, userId: 1 },
        { id: 2, title: "Read documentation", completed: false, userId: 1 }
      )}>Add items</button>
    </div>
    <h3>Filtering</h3>
    <div className="controls">
      <button onClick={() => actions.setItemFilter({ completed: false })}>Only show non-completed</button>
      <button onClick={() => actions.setItemFilter({})}>Clear filter</button>
    </div>
    <h3>Pagination</h3>
    <div className="controls">
      <Input id="pageSize"
             label="Page size"
             value={pageSize}
             onChange={setPageSize}
             type="number"
             min="0" />
      <button onClick={() => actions.setPageSize(pageSize || 0)}>Apply</button>
    </div>

    <h2>Save state</h2>
    <div className="controls">
      {_.map(saveModules, (flag, name) =>
        <Checkbox key={`module_${name}`}
                  id={name}
                  label={name}
                  checked={flagUtils.hasFlag(savedModules, flag)}
                  onChange={checked => setSavedModules(
                    flagUtils.toggleFlag(savedModules, flag, checked, saveModules))}
        />)}
      <div className="break"/>

      <button onClick={() => applyOptions({
        savedState: selectors.getSaveState(getState(), savedModules)
      })}>Save state and reload</button>
    </div>

    <h2>Columns</h2>
    <div className="controls">
      {_.map(columns, ({title}) =>
        <Checkbox id={`${title}_visibility`}
                  key={title}
                  label={title}
                  checked={columnVisibility[title] !== false} //It should be checked when undefined
                  onChange={checked => setColumnVisibility(
                    visibility => ({ ...visibility, [title]: checked }))}
        />
      )}
    </div>

    <h2>Options</h2>
    <p>Note: Changing these will cause the page to reload</p>
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
                label="Keep table width constant when resizing columns"
                checked={options.constantWidth}
                onChange={checked => applyOptions({ constantWidth: checked })} />
      <div className="break"/>

      <Input id="chunkSize"
             label="Half chunk size"
             value={chunkSize}
             onChange={setChunkSize}
             type="number"
             min="0" />
      <button onClick={() => applyOptions({ chunkSize })}>Apply</button>
    </div>

    <h2>General</h2>
    <button onClick={() => {
      sessionStorage.clear()
      window.location.reload()
    }}>Reset everything and reload</button>
  </>
}

export default FullDemo;
