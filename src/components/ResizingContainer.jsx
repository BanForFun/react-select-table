import _ from "lodash";
import React, {useState, useMemo, useRef, useCallback} from 'react';
import HeadContainer from "./HeadContainer";
import BodyContainer from "./BodyContainer";
import useEvent from "../hooks/useEvent";
import useObjectMemo from "../hooks/useObjectMemo";
import {ColumnWidthsContext} from "./ColumnGroup";

//Child of ScrollingContainer
function ResizingContainer(props) {
    const {
        columns: _columns,
        columnOrder: _order,
        initColumnWidths: initWidths,
        onColumnsResizeEnd,
        scrollToPos,
        setCursorClass,
        bodyContainerRef,
        tableBodyRef, //BodyContainer
        onItemsOpen, //BodyContainer
        dragSelectStart, //BodyContainer
        isSelectingRef, //BodyContainer
        theadClass, //HeadContainer

        ...commonProps
    } = props;

    const {
        table: { options }
    } = props;

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

    const [width, setWidth] = useState(() => _.sum(widths));
    const [padding, setPadding] = useState(() => Math.max(100 - width, 0));

    const { current: resizing } = useRef({
        index: null,
        left: 0,
        right: 0,
        widths,
        maxWidth: 0,
        started: false,
        lastMouseX: null
    });

    const calculateTableWidth = useCallback(() => {
        const actualWidth = _.sum(resizing.widths);
        const newWidth = Math.max(actualWidth, 100);
        if (newWidth > resizing.maxWidth)
            setWidth(resizing.maxWidth = newWidth);

        setPadding(resizing.maxWidth - actualWidth);
    }, [])

    const columnResizeStart = useCallback((index, mouseX, left, right) => {
        setCursorClass("rst-resizing");
        Object.assign(resizing, {
            index, left, right,
            mouseX,
            started: false,
        });
    }, [setCursorClass]);

    const updateWidth = useCallback(() => {
        const { mouseX, index, widths } = resizing;
        if (!resizing.started && _.inRange(mouseX, resizing.left, resizing.right))
            return;

        resizing.started = true;

        const minWidth = options.minColumnWidth;
        const root = bodyContainerRef.current.offsetParent;

        const [distancePx] = scrollToPos(mouseX, null);
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

        setWidths([...widths]);
        calculateTableWidth();
    }, [
        options,
        scrollToPos, calculateTableWidth
    ]);

    const handleDragEnd = useCallback(() => {
        if (resizing.index === null) return;

        resizing.index = null;
        resizing.maxWidth = 0;
        calculateTableWidth();

        if (resizing.started)
            onColumnsResizeEnd(resizing.widths);
    }, [onColumnsResizeEnd, calculateTableWidth]);

    //#region Window events

    useEvent(bodyContainerRef.current?.offsetParent, "scroll", useCallback(() => {
        if (resizing.index === null) return;
        updateWidth();
    }, [updateWidth]));

    useEvent(window, "mousemove", useCallback(e => {
        if (resizing.index === null) return;
        resizing.mouseX = e.clientX;
        updateWidth()
    },[updateWidth]));

    useEvent(window, "touchmove", useCallback(e => {
        e.stopPropagation();
        if (resizing.index === null) return;
        e.preventDefault();

        resizing.mouseX = e.touches[0].clientX;
        updateWidth();
    }, [updateWidth]), false);

    useEvent(window, "mouseup", handleDragEnd);
    useEvent(window, "touchend", handleDragEnd);

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
        columnResizeStart,
        theadClass
    }

    const bodyProps = {
        ...commonProps,
        tableBodyRef,
        onItemsOpen,
        dragSelectStart,
        bodyContainerRef,
        isSelectingRef
    }

    return <div
        className="rst-resizingContainer"
        style={{ width: `${width}%` }}
    >
        <ColumnWidthsContext.Provider value={useObjectMemo({ widths, padding })}>
            <HeadContainer {...headProps} />
            <BodyContainer {...bodyProps} />
        </ColumnWidthsContext.Provider>
    </div>
}

export default React.memo(ResizingContainer);
