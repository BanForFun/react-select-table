import React from 'react'

import Table from 'react-select-table'
import 'react-select-table/src/index.scss'

const App = () => {
  const items = [
    { id: 1, text: "Patata" },
    { id: 2, text: "Ntomata" },
    { id: 3, text: "Marouli" },
    { id: 4, text: "Karoto" }
  ]

  const columns = [
    {
      title: "Photo",
      path: "photo"
    },
    {
      title: "Sex",
      path: "Sex"
    },
    {
      title: "Ownership",
      path: "Ownership"
    },
    {
      title: "Name",
      path: "Name"
    },
    {
      title: "Barrenn",
      path: "Barrenn"
    }
  ]

  return <Table items={items} columns={columns} name="test" />
}

export default App
