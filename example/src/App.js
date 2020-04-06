import React from 'react'

import testData from "./test-data";
import Table from 'react-select-table'
import 'react-select-table/src/index.scss'
import 'bootstrap/dist/css/bootstrap.css';

const columns = [
  {
    title: "Φωτογραφία",
    path: "thumbnailUrl",
    render: url => <img src={url} height="100px" />
  },
  {
    title: "Τίτλος",
    path: "title"
  }
];

const App = () => {
  return (
    <div className="h-100">
      <Table
        onDoubleClick={alert}
        items={testData.slice(0, 200)}
        valueProperty="id"
        columns={columns}
        className="table"
        name="test" />
    </div>)
}

export default App
