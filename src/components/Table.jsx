import React, { useState, useEffect, useRef } from 'react';
import _ from "lodash";
import PropTypes from "prop-types";
import Head from "./Head";
import Body from "./Body";
import ColumnResizer from "./ColumnResizer";
import { Provider, connect } from 'react-redux';
import configureStore from '../store/configureStore';
import {
    setItems, clearSelection,
    _setOption, _setColumnCount
} from '../store/table';

const defaultOptions = {
    itemParser: item => item,
    itemFilter: () => true,
    minWidth: 3,
    isMultiselect: true,
    deselectOnContainerClick: true,
    valueProperty: null
};

function SfcTable(props) {
    const {
        name,
        columnWidth,
        columnOrder,
        className,
        clearSelection,
        valueProperty,
        _setOption
    } = props;

    const [scrollBarWidth, setScrollBarWidth] = useState(0);
    const bodyContainer = useRef();

    useEffect(() => {
        const handleResize = () => {
            const container = bodyContainer.current;
            setScrollBarWidth(container.offsetWidth - container.clientWidth);
        }

        const observer = new ResizeObserver(handleResize);
        observer.observe(bodyContainer.current.firstElementChild);

        return observer.disconnect;
    }, []);

    const options = _.pick(props, ...Object.keys(defaultOptions));
    for (let option in options) {
        const value = options[option];

        useEffect(() => {
            _setOption(option, value);
        }, [value]);
    }

    const handleMouseDown = e => {
        if (e.ctrlKey) return;
        clearSelection();
    }

    let orderedColumns = props.columns;
    if (columnOrder) {
        const ordered = _.sortBy(props.columns, col =>
            columnOrder.indexOf(col.path));
        //Columns not included in the columnOrder list will have an index of -1
        //and be at the start of the ordered list
        orderedColumns = _.takeRight(ordered, columnOrder.length);
    }

    const columns = orderedColumns.map((col, index) => {
        const props = {
            width: `${columnWidth[index]}%`,
            id: col.key || col.path
        };

        return { ...col, props };
    });

    return (
        <div className="react-select-table">
            <table className={className}>
                <Head name={name}
                    columns={columns}
                    scrollBarWidth={scrollBarWidth} />
            </table>
            <div className="bodyContainer" ref={bodyContainer}
                onMouseDown={handleMouseDown}>
                <table className={className}>
                    <ColumnResizer name={name}
                        columns={columns} />
                    <Body name={name}
                        columns={columns}
                        valueProperty={valueProperty} />
                </table>
            </div>
        </div>
    )
}

function mapStateToProps(state) {
    return _.pick(state, "columnWidth", "columnOrder");
}

export const ConnectedTable = connect(mapStateToProps, {
    clearSelection, _setOption
})(SfcTable);

function Table(params) {
    const { items, columns } = params;
    const [store, setStore] = useState();

    useEffect(() => {
        const store = configureStore();
        setStore(store);
    }, []);

    useEffect(() => {
        store && store.dispatch(setItems(items))
    }, [store, items]);

    useEffect(() => {
        store && store.dispatch(_setColumnCount(columns.length))
    }, [store, columns]);

    if (!store) return null;

    return <Provider store={store}>
        <ConnectedTable {...params} />
    </Provider>
}

Table.propTypes = {
    name: PropTypes.string.isRequired,
    valueProperty: PropTypes.string.isRequired,
    columns: PropTypes.array.isRequired,
    itemParser: PropTypes.func,
    itemFilter: PropTypes.func,
    minWidth: PropTypes.number,
    isMultiselect: PropTypes.bool,
    deselectOnContainerClick: PropTypes.bool,
    onContextMenu: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onSelectionChange: PropTypes.func
}

Table.defaultProps = {
    ...defaultOptions,
    onContextMenu: () => { },
    onDoubleClick: () => { },
    onSelectionChange: () => { }
}

export default Table;