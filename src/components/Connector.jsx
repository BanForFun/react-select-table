import styles from "../index.scss";

import React, {useContext} from 'react';
import {ReactReduxContext} from "react-redux";
import PropTypes from "prop-types";
import DefaultError from "./DefaultError";
import DefaultPagination from "./DefaultPagination";
import {tableOptions, defaultEvents} from '../utils/optionUtils';
import Root from "./Root";

function Connector({ name, namespace, ...rootProps }) {
    const options = tableOptions[namespace];
    const {context} = options;

    if (!context)
        throw new Error("Please import ReactReduxContext from react-redux and pass it to the context option");

    const contextValue = useContext(context);

    rootProps.options = options;
    rootProps.name ??= namespace;

    return <ReactReduxContext.Provider value={contextValue}>
        <div className={styles.container}>
            <Root {...rootProps} />
        </div>
    </ReactReduxContext.Provider>
}

export default Connector;

const columnShape = PropTypes.shape({
    title: PropTypes.string,
    key: PropTypes.string,
    path: PropTypes.string,
    render: PropTypes.func,
    isHeader: PropTypes.bool
});

Connector.propTypes = {
    namespace: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(columnShape).isRequired,
    Error: PropTypes.elementType,
    Pagination: PropTypes.elementType,
    loadingIndicator: PropTypes.node,
    emptyPlaceholder: PropTypes.node,
    name: PropTypes.string,
    className: PropTypes.string,
    columnOrder: PropTypes.arrayOf(PropTypes.number),
    initColumnWidths: PropTypes.arrayOf(PropTypes.number),
    showSelectionRect: PropTypes.bool,
    liveColumnResize: PropTypes.bool,
    scrollFactor: PropTypes.number,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func,
    onColumnsResizeEnd: PropTypes.func,
    onKeyDown: PropTypes.func
};

Connector.defaultProps = {
    onItemsOpen: () => { },
    onColumnsResizeEnd: () => { },
    onKeyDown: () => { },
    initColumnWidths: [],
    scrollFactor: 0.2,
    Error: DefaultError,
    Pagination: DefaultPagination,
    loadingIndicator: null,
    emptyPlaceholder: null,
    showSelectionRect: true,
    liveColumnResize: true,
    ...defaultEvents
};
