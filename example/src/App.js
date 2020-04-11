import React, { useEffect, useState } from 'react'

import { Table } from 'react-select-table';
import 'react-select-table/dist/index.css';
import 'bootstrap/dist/css/bootstrap.css';

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
  const [selection, setSelection] = useState([]);

  useEffect(() => {
    async function getTodos() {
      const response = await fetch("https://jsonplaceholder.typicode.com/todos");
      const data = await response.json();
      setTodos(data);
    }

    getTodos();
  }, []);

  return (
    <div className="container">
      <div className="w-25">
        <h1>Guide</h1>
        <div className="alert alert-warning">
          The performance is awfull when the developer tools are open
        </div>
        <b>Selection:</b>
        {selection.join(", ")}
      </div>
      <div className="pl-3 w-75">
        <h1>Table</h1>
        {todos ? (
          <Table
            items={todos}
            onItemsOpen={alert}
            filter={{ id: 1 }}
            isListbox={true}
            isMultiselect={false}
            itemPredicate={() => true}
            onSelectionChange={setSelection}
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
