import React from 'react'

import testData from "./test-data";
import Table from 'react-select-table'
import 'react-select-table/src/index.scss'
import 'bootstrap/dist/css/bootstrap.css';

const columns = [
  {
    title: "Φωτογραφία",
    path: "thumbnail_url",
    render: url => <img src={url} height="100px" />
  },
  {
    title: "Φύλλο",
    path: "sex"
  },
  {
    title: "Ιδιοκτησία",
    path: "ownership"
  },
  {
    title: "Κατάσταση",
    path: "status"
  },
  {
    title: "Μέγεθος",
    path: "size"
  }
];

const App = () => {
  return (
    <Table
      items={testData}
      valueProperty="pet_id"
      columns={columns}
      className="table"
      name="test" />)
}

export default App
