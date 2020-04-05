import React, { useState, useEffect, useRef } from 'react';
import _ from "lodash";
import PropTypes, { object } from "prop-types";
import Head from "./Head";
import Body from "./Body";
import ColumnResizer from "./ColumnResizer";
import { Provider, connect } from 'react-redux';
import configureStore from '../store/configureStore';
import { setItems, clearSelection } from '../store/table';

function SfcTable({
    name,
    options,
    columnWidth,
    columnOrder,
    className,
    clearSelection
}) {
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
    }, [])

    const handleMouseDown = e => {
        if (e.ctrlKey) return;
        clearSelection();
    }

    let orderedColumns = options.columns;
    if (columnOrder.length > 0) {
        const ordered = _.sortBy(options.columns, col =>
            columnOrder.indexOf(col.path));
        //Columns not included in the columnOrder list will have an index of -1
        //and be at the start of the ordered list
        orderedColumns = _.takeRight(ordered, columnOrder.length);
    }

    const parsedColumns = orderedColumns.map((col, index) => {
        const props = {
            width: `${columnWidth[index]}%`,
            id: col.key || col.path
        };

        return { ...col, props };
    });

    const params = {
        name, options,
        columns: parsedColumns
    }

    return (
        <div className="react-select-table">
            <table className={className}>
                <Head {...params} scrollBarWidth={scrollBarWidth} />
            </table>
            <div className="bodyContainer" ref={bodyContainer}
                onMouseDown={handleMouseDown}>
                <table className={className}>
                    <ColumnResizer {...params} />
                    <Body {...params} />
                </table>
            </div>
        </div>
    )
}

function mapStateToProps(state) {
    return _.pick(state, "columnWidth", "columnOrder");
}

const ConnectedTable = connect(mapStateToProps, {
    clearSelection
})(SfcTable);

function Table({ items, ...params }) {
    const [store, setStore] = useState();

    useEffect(() => {
        if (items) {
            const store = configureStore(params.options);
            setStore(store);
        } else
            setStore(null);
    }, []);

    useEffect(() => {
        store && store.dispatch(setItems(items))
    }, [items, store]);

    if (store === undefined) return null;
    if (store === null)
        return <SfcTable {...params} />;

    return <Provider store={store}>
        <ConnectedTable {...params} />
    </Provider>
}

const optionsShape = {
    valueProperty: PropTypes.string.isRequired,
    columns: PropTypes.array.isRequired,
    itemParser: PropTypes.func,
    itemFilter: PropTypes.func,
    minWidth: PropTypes.number
}

Table.propTypes = {
    options: PropTypes.shape(optionsShape),
    name: PropTypes.string.isRequired
}

export default Table;

export function createTableOptions(options) {
    const defaultOptions = {
        itemParser: item => item,
        itemFilter: () => true,
        minWidth: 3,
        isMultiselect: true,
        scrollBar: true,
        deselectOnContainerClick: true
    };

    return _.defaults(options, defaultOptions);
}