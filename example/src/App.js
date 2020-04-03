import React from 'react'

import Table from 'react-select-table'
import 'react-select-table/dist/index.css'

const App = () => {
  const items = [
    { id: 1, text: "Patata" },
    { id: 2, text: "Ntomata" },
    { id: 3, text: "Marouli" },
    { id: 4, text: "Karoto" }
  ]

  return <Table items={items} />
}

export default App
