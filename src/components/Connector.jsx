import React, {useContext, useEffect} from 'react';
import {ReactReduxContext} from "react-redux";
import PropTypes from "prop-types";
import DefaultPagination from "./DefaultPagination";
import {tableUtils, defaultEventHandlers} from '../utils/tableUtils';
import Root from "./Root";

function Connector(props) {
    const {
        name, namespace,
        ...rootProps
    } = props;

    const utils = tableUtils[namespace];

    const { context } = utils.public.options;
    if (!context)
        throw new Error("Please import 'ReactReduxContext' from 'react-redux' and pass it to the 'context' option");

    const contextValue = useContext(context);

    //Register redux event handlers
    const { eventHandlers } = utils.private;
    for (let handlerName in eventHandlers) {
        const handler = props[handlerName];
        delete rootProps[handlerName];

        useEffect(() => {
            eventHandlers[handlerName] = handler;
        }, [handler, eventHandlers]);
    }

    rootProps.utils = utils.public;
    rootProps.name ??= namespace;

    return <ReactReduxContext.Provider value={contextValue}>
        <Root {...rootProps} />
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
    tableClass: PropTypes.string,
    containerRef: refType,
    columnOrder: PropTypes.arrayOf(PropTypes.number),
    initColumnWidths: PropTypes.arrayOf(PropTypes.number),
    autoFocus: PropTypes.bool,
    showSelectionRect: PropTypes.bool,
    dragSelectionScrollFactor: PropTypes.number,
    columnResizingScrollFactor: PropTypes.number,
    getRowClassName: PropTypes.func,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func,
    onColumnsResizeEnd: PropTypes.func,
    onKeyDown: PropTypes.func
};

Connector.defaultProps = {
    getRowClassName: () => null,
    className: "rst-table rst-hover",
    initColumnWidths: [],
    dragSelectionScrollFactor: 0.5,
    columnResizingScrollFactor: 0.2,
    Error: 'span',
    Pagination: DefaultPagination,
    loadingIndicator: null,
    emptyPlaceholder: null,
    showSelectionRect: true,
    autoFocus: false,
    ...defaultEventHandlers
};
