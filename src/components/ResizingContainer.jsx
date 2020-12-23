import styles from "../index.scss";

import _ from "lodash";
import React, {useState, useMemo, useRef, useCallback, useEffect} from 'react';
import HeadContainer from "./HeadContainer";
import BodyContainer from "./BodyContainer";
import useEvent from "../hooks/useEvent";
import {ColumnWidthsContext} from "./ColumnGroup";

function ResizingContainer(props) {
    const {
        columns: _columns,
        columnOrder: _order,
        initColumnWidths: initWidths,
        onColumnsResizeEnd,
        tableBodyRef, //BodyContainer
        onItemsOpen, //BodyContainer
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

    const width = useMemo(() => _.sum(widths), [widths]);

    const [maxWidth, setMaxWidth] = useState(0);
    useEffect(() => {
        if (width <= maxWidth) return;
        setMaxWidth(width);
    }, [width, maxWidth]);

    const { current: resizing } = useRef({
        index: null,
        left: 0,
        right: 0,
        widths,
        started: false
    });

    const refreshWidths = useCallback(() => {
        setWidths([...resizing.widths]);
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

        resizing.started = true;

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

        refreshWidths();
    }, [
        options,
        refreshWidths
    ]);

    const handleDragEnd = useCallback(() => {
        if (resizing.index === null) return;
        resizing.index = null;

        if (resizing.started) {
            onColumnsResizeEnd(resizing.widths);
            setMaxWidth(0);
        }
    }, [onColumnsResizeEnd]);

    //#region Window events

    useEvent(document,"mousemove", useCallback(e => {
        if (resizing.index === null) return;
        updateWidth(e.clientX)
    },[updateWidth]));

    useEvent(document.body,"touchmove", useCallback(e => {
        e.stopPropagation();

        if (resizing.index === null) return;
        e.preventDefault();

        const touch = e.touches[0];
        updateWidth(touch.clientX);
    }, [updateWidth]), false);

    useEvent(document, "mouseup", handleDragEnd);
    useEvent(document.body, "touchend", handleDragEnd);

    //#endregion

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
        dragSelectStart,
        bodyContainerRef
    }

    return <div
        className={styles.resizingContainer}
        style={{
            width: `${width}%`,
            paddingRight: `${maxWidth - width}%`
        }}
    >
        <ColumnWidthsContext.Provider value={widths}>
            <HeadContainer {...headProps} />
            <BodyContainer {...bodyProps} />
        </ColumnWidthsContext.Provider>
    </div>
}

export default React.memo(ResizingContainer);
