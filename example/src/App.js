import React, { useState } from 'react'
import { Table, useTable } from 'react-select-table';
import PulseLabel from './components/PulseLabel';

import 'bootstrap/dist/css/bootstrap.css';
import 'react-select-table/dist/index.css';

import todos from "./todos";

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
  // const [todos, setTodos] = useState();

  const [selection, setSelection] = useState([]);
  const [contextMenu, setContextMenu] = useState([]);
  const [openItems, setOpenItems] = useState([]);

  useTable("test", { valueProperty: "id" });
  useTable("test1");

  // const getTodos = useCallback(async function () {
  //   setTodos(null);
  //   const response = await fetch("https://jsonplaceholder.typicode.com/todos");
  //   const data = await response.json();
  //   setTodos(data.slice(0, 100));
  // }, []);

  // useEffect(() => { getTodos() }, [getTodos]);

  return (
    <div className="container">
      <div className="row">
        <div className="col">
          <h1>Table</h1>
          {todos ?
            <Table
              items={todos}
              onContextMenu={setContextMenu}
              onSelectionChange={setSelection}
              onItemsOpen={setOpenItems}
              columns={columns}
              className="table"
              name="test" />
            : "Loading..."}
        </div>
        <div className="d-none d-md-block col-3">
          <h1>Events</h1>
          <PulseLabel title="Selection" items={selection} />
          <PulseLabel title="Context menu" items={contextMenu} />
          <PulseLabel title="Open items" items={openItems} />
          {/* <button className="btn btn-primary" onClick={getTodos}>Refresh</button> */}
        </div>
      </div>
    </div>)
}

export default App
