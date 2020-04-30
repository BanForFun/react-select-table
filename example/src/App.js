import React, { useEffect, useState, useCallback } from 'react'

import { Table, useTableStore } from 'react-select-table';
import 'bootstrap/dist/css/bootstrap.css';
import 'react-select-table/dist/index.css';
import PulseLabel from './components/PulseLabel';
import CheckBox from './components/CheckBox';

const columns = [
  {
    title: "#",
    path: "id",
    isHeader: true
  },
  {
    title: "Title",
    path: "title"
  },
  {
    title: "Completed",
    path: "completed",
    render: renderCheckOrX
  }
];

function renderCheckOrX(bool) {
  return bool ?
    <i className="fa fa-check text-success" /> :
    <i className="fa fa-times text-danger" />;
}

function App() {
  const tableStore = useTableStore();
  const [todos, setTodos] = useState();

  const [isMultiselect, setMultiselect] = useState(true);
  const [isListbox, setListBox] = useState(false);

  const [selection, setSelection] = useState([]);
  const [contextMenu, setContextMenu] = useState([]);
  const [openItems, setOpenItems] = useState([]);

  const getTodos = useCallback(async () => {
    setTodos(null);
    const response = await fetch("https://jsonplaceholder.typicode.com/todos");
    const data = await response.json();
    setTodos(data.slice(0, 100));
  }, []);

  useEffect(getTodos, [getTodos]);

  return (
    <div className="container">
      <div className="w-25">
        <h1>Settings</h1>
        <CheckBox label="Multiselect" id="isMultiselect"
          value={isMultiselect} onChange={setMultiselect} />
        <CheckBox label="Listbox mode" id="isListbox"
          value={isListbox} onChange={setListBox} />

        <h1 className="mt-3">Events</h1>
        <PulseLabel title="Selection" items={selection} />
        <PulseLabel title="Context menu" items={contextMenu} />
        <PulseLabel title="Open items" items={openItems} />
        <button className="btn btn-primary" onClick={getTodos}>Refresh</button>
      </div>
      <div className="pl-3 w-75">
        <h1>Table</h1>

        {todos ? (
          <Table
            store={tableStore}
            items={todos}
            minColumnWidth={3}
            isListbox={isListbox}
            isMultiselect={isMultiselect}
            onContextMenu={setContextMenu}
            onSelectionChange={setSelection}
            onItemsOpen={setOpenItems}
            valueProperty="id"
            columns={columns}
            className="table"
            name="test" />) :
          <p>Loading...</p>
        }
      </div>

    </div>)
}

export default App
