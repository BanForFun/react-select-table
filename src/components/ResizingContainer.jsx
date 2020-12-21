import styles from "../index.scss";

import _ from "lodash";
import React, {useState, useMemo, useRef, useCallback} from 'react';
import HeadContainer from "./HeadContainer";
import BodyContainer from "./BodyContainer";
import useWindowEvent from "../hooks/useWindowEvent";
import {ColumnWidthsContext} from "./ColumnGroup";

function ResizingContainer(props) {
    const {
        columns: _columns,
        columnOrder: _order,
        initColumnWidths: initWidths,
        onColumnsResizeEnd,
        liveColumnResize,
        tableBodyRef, //BodyContainer
        onItemsOpen, //BodyContainer
        onKeyDown, //BodyContainer
        dragSelectStart, //BodyContainer
        bodyContainerRef, //BodyContainer

        ...commonProps
    } = props;

    const { options } = props;

    const order = useMemo(() =>
        _order ?? _.range(_columns.length),
        [_order, _columns]
    );

    const [widths, setWidths] = useState(() => {
        const count = order.length;

        return initWidths.length === count
            ? initWidths
            : _.times(count, _.constant(100 / count));
    });

    const { current: resizing } = useRef({
        index: null,
        left: 0,
        right: 0,
        widths,
        started: false
    });

    const refreshWidths = useCallback(() => {
        const newWidths = [...resizing.widths];
        setWidths(newWidths);
        return newWidths
    }, []);

    const columnResizeStart = useCallback((index, left, right) => {
        Object.assign(resizing, {
            index, left, right,
            started: false
        });
    }, []);

    const updateWidth = useCallback(x => {
        if (!resizing.started && _.inRange(x, resizing.left, resizing.right))
            return;

        const { index, widths } = resizing;
        const minWidth = options.minColumnWidth;

        const { offsetParent: root, offsetLeft } = bodyContainerRef.current;
        const bounds = root.getBoundingClientRect();
        const distancePx = x - bounds.x - offsetLeft + root.scrollLeft;
        const distancePercent = 100 / root.clientWidth * distancePx;
        const offsetPercent = _.sum(_.take(widths, index));
        const widthPercent = Math.max(distancePercent - offsetPercent, minWidth);

        if (options.scrollX) {
            widths[index] = widthPercent;
        } else {
            const available = widths[index] + widths[index + 1];
            const limited = _.clamp(widthPercent, minWidth, available - minWidth);
            widths[index] = limited;
            widths[index + 1] = available - limited;
        }

        if (liveColumnResize)
            refreshWidths();

    }, [
        options,
        refreshWidths,
        liveColumnResize
    ]);

    const handleDragEnd = useCallback(() => {
        if (resizing.index === null) return;
        resizing.index = null;

        if (resizing.started)
            onColumnsResizeEnd(refreshWidths());
    }, [onColumnsResizeEnd, refreshWidths]);

    //#region Window events

    useWindowEvent("mousemove", useCallback(e => {
        if (resizing.index === null) return;
        updateWidth(e.clientX)
    },[updateWidth]));

    useWindowEvent("touchmove", useCallback(e => {
        if (resizing.index === null) return;
        e.preventDefault();

        const [touch] = e.touches;
        updateWidth(touch.clientX);
    }, [updateWidth]), false);

    useWindowEvent("mouseup", handleDragEnd);
    useWindowEvent("touchend", handleDragEnd);

    //#endregion

    const width = useMemo(() => _.sum(widths), [widths]);

    commonProps.columns = useMemo(() => order.map(index => {
        const column = _columns[index];
        return {
            render: v => v,
            ...column,
            _id: column.key ?? column.path
        }
    }), [_columns, order]);

    const headProps = {
        ...commonProps,
        columnResizeStart
    }

    const bodyProps = {
        ...commonProps,
        tableBodyRef,
        onItemsOpen,
        onKeyDown,
        dragSelectStart,
        bodyContainerRef
    }

    return <div
        className={styles.resizingContainer}
        style={{ width: `${width}%` }}
    >
        <ColumnWidthsContext.Provider value={widths}>
            <HeadContainer {...headProps} />
            <BodyContainer {...bodyProps} />
        </ColumnWidthsContext.Provider>
    </div>
}

export default React.memo(ResizingContainer);
