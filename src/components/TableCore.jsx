import React, { Component } from 'react';
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
    _setColumnCount
} from '../store/table';

class TableCore extends Component {
    state = {}
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