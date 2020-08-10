import React, {useEffect} from 'react';
import _ from "lodash";
import useConstructor from "../hooks/useConstructor";
import getStore, {injectReducers, removeReducers} from "../store/configureStore";
import createTable from "../store/table";
import {tableOptions} from "../utils/optionUtils";
import {Provider} from "react-redux";

export default function withTables(Page, tables) {
    return function WithTables(props) {
        useConstructor(() => {
            const reducers = _.mapValues(tables, (options, name) => {
                const customOptions = { ...options, path: name };
                return createTable(name, customOptions);
            });

            injectReducers(reducers);
        });

        useEffect(() => {
            //Return cleanup method
            return () => {
                const names = Object.keys(tables);
                names.forEach(name => delete tableOptions[name]);
                removeReducers(names);
            }
        }, []);

        return <Provider store={getStore()}>
            <Page {...props}/>
        </Provider>
    }
}
