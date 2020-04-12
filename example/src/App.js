import React, { useEffect, useState } from 'react'

import { Table } from 'react-select-table';
import 'react-select-table/dist/index.css';
import 'bootstrap/dist/css/bootstrap.css';
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

  const [todos, setTodos] = useState();

  const [isMultiselect, setMultiselect] = useState(true);
  const [isListbox, setListBox] = useState(false);

  const [selection, setSelection] = useState([]);
  const [contextMenu, setContextMenu] = useState([]);
  const [openItems, setOpenItems] = useState([]);

  useEffect(() => {
    async function getTodos() {
      const response = await fetch("https://jsonplaceholder.typicode.com/todos");
      const data = await response.json();
      setTodos(data.slice(0, 100));
    }

    getTodos();
  }, []);
  return (
    <div className="container">
      <div className="w-25">
        <h1>Settings</h1>
        <div className="alert alert-warning">
          The performance is awfull when the developer tools are open
        </div>

        <CheckBox label="Multiselect" id="isMultiselect"
          value={isMultiselect} onChange={setMultiselect} />
        <CheckBox label="Listbox mode" id="isListbox"
          value={isListbox} onChange={setListBox} />
        <div>Disables item deselection when user clicks on empty space</div>

        <h1 className="mt-3">Events</h1>
        <PulseLabel title="Selection" items={selection} />
        <PulseLabel title="Context menu" items={contextMenu} />
        <PulseLabel title="Open items" items={openItems} />
      </div>
      <div className="pl-3 w-75">
        <h1>Table</h1>
        {todos ? (
          <Table
            items={todos}
            minColumnWidth={10}
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
