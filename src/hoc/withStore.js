import React from 'react';
import { Provider } from "react-redux"
import getStore from "../store/configureStore"

export default function withStore(Wrapped) {
    return function WithStore(ownProps) {
        return <Provider store={getStore(true)}>
            <Wrapped {...ownProps} />
        </Provider>
    }
}