import React, {useContext, useEffect} from 'react';
import {ReactReduxContext} from "react-redux";
import PropTypes from "prop-types";
import DefaultPagination from "./DefaultPagination";
import {tableUtils} from '../utils/tableUtils';
import Root from "./Root";
import {defaultEventHandlers} from "../models/EventRaisers";

function Connector(props, ref) {
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
    const { eventHandlers } = utils;
    for (const handlerName in eventHandlers) {
        const handler = props[handlerName];
        delete rootProps[handlerName];

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            eventHandlers[handlerName] = handler;
        }, [handler, eventHandlers, handlerName]);
    }

    rootProps.utils = utils.public;
    rootProps.containerRef = ref;
    rootProps.name ??= namespace;

    return <ReactReduxContext.Provider value={contextValue}>
        <Root {...rootProps} />
    </ReactReduxContext.Provider>
}

const Table = React.forwardRef(Connector);

const columnShape = PropTypes.shape({
    title: PropTypes.string,
    key: PropTypes.string,
    path: PropTypes.string,
    render: PropTypes.func,
    isHeader: PropTypes.bool
});

Table.propTypes = {
    namespace: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(columnShape).isRequired,
    errorComponent: PropTypes.elementType,
    paginationComponent: PropTypes.elementType,
    loadingIndicator: PropTypes.node,
    emptyPlaceholder: PropTypes.node,
    name: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string,
    columnOrder: PropTypes.arrayOf(PropTypes.number),
    autoFocus: PropTypes.bool,
    showSelectionRect: PropTypes.bool,
    dragSelectScrollFactor: PropTypes.number,
    columnResizeScrollFactor: PropTypes.number,
    getRowClassName: PropTypes.func,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func,
    onColumnResizeEnd: PropTypes.func,
    onKeyDown: PropTypes.func
};

Table.defaultProps = {
    getRowClassName: () => null,
    className: "rst-default",
    dragSelectScrollFactor: 0.5,
    columnResizeScrollFactor: 0.2,
    errorComponent: 'span',
    paginationComponent: DefaultPagination,
    loadingIndicator: null,
    emptyPlaceholder: null,
    showSelectionRect: true,
    autoFocus: false,
    ...defaultEventHandlers
};

export default Table;
