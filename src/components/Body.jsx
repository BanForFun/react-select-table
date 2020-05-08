import _ from "lodash";
import React, { useCallback } from 'react';
import styles from "../index.scss";
import { getSubState, getNamedActions } from "../selectors/namespaceSelector";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

function Body({
    columns,
    name,
    valueProperty,
    items,
    rowRefs,
    selectedValues,
    activeValue,
    actions
}) {
    const handleRowSelect = useCallback((e, value) => {
        if (e.button !== 0) return;
        actions.selectRow(value, e.ctrlKey, e.shiftKey);
    }, [actions])

    const handleRowContextMenu = useCallback((e, value) => {
        e.stopPropagation();
        actions.contextMenu(value, e.ctrlKey);
    }, [actions]);

    const renderColumn = useCallback((row, column) => {
        const rowValue = row[valueProperty];
        const { props, path, render, isHeader } = column;

        const value = _.get(row, path);
        const content = render ? render(value, row) : value;

        const key = `cell_${name}_${rowValue}_${props.id}`;
        if (isHeader) return <th key={key}>{content}</th>;
        return <td key={key}>{content}</td>
    }, [valueProperty, name]);

    const renderRow = useCallback((row, index) => {
        const value = row[valueProperty];

        const classes = [];
        if (selectedValues.includes(value))
            classes.push(styles.selected);
        if (activeValue === value)
            classes.push(styles.active);
        if (row.classNames)
            classes.push(...row.classNames);

        return <tr key={`tr_${name}_${value}`}
            ref={rowRefs[index]}
            className={classes.join(' ')}
            onContextMenu={e => handleRowContextMenu(e, value)}
            onMouseDown={e => handleRowSelect(e, value)}>
            {columns.map(col => renderColumn(row, col))}
        </tr>
    }, [
        valueProperty,
        rowRefs,
        name,
        columns,
        selectedValues,
        activeValue,
        actions,
        handleRowContextMenu,
        handleRowSelect,
        renderColumn
    ]);

    return <tbody>
        {items.map(renderRow)}
    </tbody>;
}

function mapState(root, props) {
    const state = getSubState(root, props);

    return {
        items: state.tableItems,
        selectedValues: state.selectedValues,
        activeValue: state.activeValue,
        valueProperty: state.valueProperty
    };
}

function mapDispatch(dispatch, props) {
    const actions = getNamedActions(props);
    return { actions: bindActionCreators(actions, dispatch) };
}

export default connect(mapState, mapDispatch)(Body);