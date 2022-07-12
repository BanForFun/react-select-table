import 'react-toastify/dist/ReactToastify.css';
import "./index.css";

import React from "react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";

import { createRoot } from 'react-dom/client';

const container = document.getElementById("root")
const root = createRoot(container);

root.render(
  <BrowserRouter basename={process.env.PUBLIC_URL}>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>,
);
