import React, { Component } from 'react';
import _ from "lodash";
import PropTypes from "prop-types";
import { connect } from 'react-redux';
import {
    clearSelection,
    setRowSelected,
    selectAll,
    setActiveRow,
    selectRow,
    contextMenu,
    _setEventHandlers,
    _setColumnCount,
    defaultEventHandlers
} from '../store/table';

class TableCore extends Component {
    state = {};
    eventHandlers = {};

    componentDidMount() {
        this.registerEventHandlers();
    }

    componentDidUpdate(prevProps) {
        this.updateColumnCount(prevProps);
    }

    get values() {
        return _.map(this.props.items, this.props.valueProperty);
    }

    registerEventHandlers() {
        for (let name in defaultEventHandlers) {
            this.eventHandlers[name] = params => {
                const handler = this.props[name];
                if (!handler) return;
                handler(params);
            };
        }

        this.props._setEventHandlers(this.eventHandlers);
    }

    updateColumnCount(prevProps) {
        if (this.props.columnOrder) return;

        const count = this.props.columns.length;
        if (prevProps.columns.length === count) return;
        this.props._setColumnCount(count);
    }

    render() {
        return <p>Hello</p>;
    }
}

function mapStateToProps(state, { statePath }) {
    const subState = _.get(state, statePath, state);

    const directMap = _.pick(subState,
        "columnWidth",
        "columnOrder",
        "selectedValues",
        "activeValue",
        "isLoading",
        "valueProperty",
        "isMultiselect",
        "isListbox"
    );

    return {
        ...directMap,
        items: subState.tableItems
    }
}

export default connect(mapStateToProps, {
    clearSelection,
    setRowSelected,
    selectAll,
    selectRow,
    contextMenu,
    setActiveRow,
    _setColumnCount,
    _setEventHandlers
})(TableCore);

const columnShape = PropTypes.shape({
    title: PropTypes.string,
    key: PropTypes.string,
    path: PropTypes.string,
    render: PropTypes.func,
    isHeader: PropTypes.bool
});

TableCore.propTypes = {
    name: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(columnShape).isRequired,
    statePath: PropTypes.arrayOf(PropTypes.string),
    emptyPlaceholder: PropTypes.element,
    onContextMenu: PropTypes.func,
    onItemsOpen: PropTypes.func,
    onSelectionChange: PropTypes.func
};

TableCore.defaultProps = {
    onItemsOpen: () => { }
};