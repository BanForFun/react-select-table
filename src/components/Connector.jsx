import React, {useContext} from 'react';
import classNames from "classnames";
import {ReactReduxContext} from "react-redux";
import PropTypes from "prop-types";
import DefaultError from "./DefaultError";
import DefaultPagination from "./DefaultPagination";
import {tableStorage, defaultEvents} from '../utils/tableUtils';
import Root from "./Root";

function Connector({ name, namespace, id, className, ...rootProps }) {
    const storage = tableStorage[namespace];

    const { context } = storage.options;
    if (!context)
        throw new Error("Please import ReactReduxContext from react-redux and pass it to the context option");

    const contextValue = useContext(context);

    rootProps.storage = storage;
    rootProps.name ??= namespace;

    return <ReactReduxContext.Provider value={contextValue}>
        <div id={id} className={classNames("rst-container", className)}>
            <Root {...rootProps} />
        </div>
    </ReactReduxContext.Provider>
}

export default Connector;

const refType = PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
]);

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
    id: PropTypes.string,
    className: PropTypes.string,
    itemContainerRef: refType,
    columnOrder: PropTypes.arrayOf(PropTypes.number),
    initColumnWidths: PropTypes.arrayOf(PropTypes.number),
    showSelectionRect: PropTypes.bool,
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
    className: "rst-table",
    initColumnWidths: [],
    scrollFactor: 0.2,
    Error: DefaultError,
    Pagination: DefaultPagination,
    loadingIndicator: null,
    emptyPlaceholder: null,
    showSelectionRect: true,
    ...defaultEvents
};
