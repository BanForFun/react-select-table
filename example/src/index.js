import './index.css'

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { Provider, ReactReduxContext } from 'react-redux'
import setupStore from "./store";
import {setDefaultOptions} from "react-select-table";

setDefaultOptions({
    context: ReactReduxContext
});

const store = setupStore();

ReactDOM.render(
    <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Provider store={store}>
            <App />
        </Provider>
    </BrowserRouter>,
    document.getElementById('root')
)
