import "./App.scss";
import 'react-select-table/dist/index.css'
import 'react-toastify/dist/ReactToastify.css';

import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import FullDemo from './components/FullDemo';

function App() {
  return <div id="app">
    <Routes>
      <Route path="full" element={<FullDemo />} />
      <Route path="/" element={<Navigate to="/full" />} />
    </Routes>
  </div>
}

export default App;
