import "./App.scss";

import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import FullDemo from './components/FullDemo';
import { Slide, ToastContainer } from 'react-toastify'

function App() {
  return <div id="App">
    <ToastContainer transition={Slide} position='bottom-right' newestOnTop={true}/>
    <Routes>
      <Route path="full" element={<FullDemo />} />
      <Route path="/" element={<Navigate to="/full" />} />
    </Routes>
  </div>
}

export default App;
