import _ from "lodash";
import React, {useState, useMemo, useRef, useCallback, useEffect} from 'react';
import HeadContainer from "./HeadContainer";
import BodyContainer from "./BodyContainer";
import useEvent from "../hooks/useEvent";
import useObjectShallowMemo from "../hooks/useObjectShallowMemo";
import {ColumnGroupContext} from "./ColumnGroup";

const defaultColumnRenderer = value => value;

function parseColumn(col) {
    return {
        render: defaultColumnRenderer,
        ...col,
        _id: col.key ?? col.path
    }
}

//Child of ScrollingContainer
function ResizingContainer(props) {
    const {
        columns: _columns,
        columnOrder,
        initColumnWidths,
        setMode,
        columnResizingScrollFactor: scrollFactor,
        bodyContainerRef,
        getRowClassName, //BodyContainer
        selectionRectRef, //BodyContainer
        tableBodyRef, //BodyContainer
        dragSelectStart, //BodyContainer
        placeholder, //BodyContainer

        ...commonProps
    } = props;

    const {
        utils: { options, hooks, eventRaisers },
        name,
    } = props;

    const raiseColumnsResizeEnd = hooks.useSelectorGetter(eventRaisers.columnsResizeEnd);

    const parseWidths = useCallback((widths) => {
        const min = _.min(widths);
        const sum = _.sum(widths);
        const container = Math.max(100, sum);

        return {
            minContainer: container / min * options.minColumnWidth,
            container,
            headers: widths,
            spacer: container - sum,
            resizing: false
        }
    }, [options]);

    const columns = useMemo(() =>
        columnOrder?.map(index => parseColumn(_columns[index])) ?? _columns.map(parseColumn),
    [_columns, columnOrder]);

    const [widths, setWidths] = useState(parseWidths(initColumnWidths));

    useEffect(() => {
        const count = columns.length;
        if (count === widths.headers.length) return;

        const percentWidths = _.times(count, _.constant(100 / count));
        setWidths(parseWidths(percentWidths));
    }, [columns, widths, parseWidths])

    const colGroupRefs = useRef({}).current;
    const resizingContainerRef = useRef();

    const resizing = useRef({
        index: null
    }).current;

    const columnResizeStart = useCallback((index, mouseX, offsetLeft, colWidths) => {
        setMode("resizing");
        Object.assign(resizing, {
            index,
            originX: mouseX,
            colWidths,
            totalWidth: _.sum(_.initial(colWidths)),
            offsetLeft,
            mouseX,
            pendingFrames: 0,
            waitForRender: false
        });
    }, [setMode, resizing]);

    const columnResizeEnd = useCallback(() => {
        setTimeout(() => {
            const { clientWidth } = bodyContainerRef.current.offsetParent;
            const percentWidths = _.initial(resizing.colWidths).map(px => px / clientWidth * 100);
            setWidths(parseWidths(percentWidths));

            raiseColumnsResizeEnd(percentWidths);
        });
    }, [raiseColumnsResizeEnd, bodyContainerRef, parseWidths, resizing])

    const updateWidth = useCallback((ctrlKey, mouseX = null) => {
        const {index, colWidths, offsetLeft} = resizing;
        if (index == null) return false;

        if (mouseX)
            resizing.mouseX = mouseX;
        else
            mouseX = resizing.mouseX;

        //Start resizing if pointer is more that 5 pixels away from origin position
        if (!widths.resizing && !resizing.waitForRender && Math.abs(resizing.originX - mouseX) > 5) {
            resizing.waitForRender = true;
            setWidths({
                minContainer: 0,
                container: 100,
                headers: _.initial(colWidths),
                spacer: _.last(colWidths),
                resizing: true
            });
        } else if (!widths.resizing) return;

        //Get container bounds
        const scrollingContainer = bodyContainerRef.current.offsetParent;
        const containerX = scrollingContainer.getBoundingClientRect().x;
        const { clientWidth, scrollLeft } = scrollingContainer;

        //Calculate new width
        const relX = mouseX - containerX + scrollLeft;
        const minWidth = options.minColumnWidth;
        let newWidth = Math.max(relX - offsetLeft, minWidth);

        const newWidths = {};
        let setScroll = scrollLeft;

        if (options.constantWidth || ctrlKey) {
            const availableWidth = colWidths[index] + colWidths[index + 1];
            newWidth = Math.min(availableWidth - minWidth, newWidth);
            newWidths[index + 1] = availableWidth - newWidth;
        } else {
            const targetTotalWidth = resizing.totalWidth + newWidth - colWidths[index];
            const visibleRight = scrollLeft + clientWidth;

            let scrollOffset = 0;
            if (targetTotalWidth > clientWidth)
                scrollOffset =
                    Math.max(0, relX - visibleRight) - //Scroll to right
                    Math.max(0, visibleRight - targetTotalWidth) //Scroll to left

            if (scrollOffset)
                newWidth = colWidths[index] + scrollOffset * scrollFactor;

            if (scrollOffset > 0)
                setScroll = offsetLeft + newWidth - clientWidth;

            const totalWidth = resizing.totalWidth += newWidth - colWidths[index];
            newWidths[colWidths.length - 1] = Math.max(0, clientWidth - totalWidth);
        }

        if (newWidth === colWidths[index]) return;

        newWidths[index] = newWidth;
        Object.assign(colWidths, newWidths);

        resizing.pendingFrames++;
        requestAnimationFrame(() => {
            _.forEach(newWidths, (width, index) => {
                _.forEach(colGroupRefs, (group) => {
                    if (!group) return; //Body group is undefined when showing placeholder
                    group.children[index].style.width = width + "px";
                })
            })

            scrollingContainer.scrollLeft = setScroll;

            if (!--resizing.pendingFrames && resizing.index === null)
                columnResizeEnd();
        });
    }, [
        options, scrollFactor, columnResizeEnd, widths, resizing,
        bodyContainerRef, colGroupRefs
    ]);

    const handleDragEnd = useCallback(() => {
        if (resizing.index === null) return;
        resizing.index = null;

        if (widths.resizing && !resizing.pendingFrames)
            columnResizeEnd();

    }, [columnResizeEnd, widths, resizing]);

    //#region Window events

    useEvent(bodyContainerRef.current?.offsetParent, "scroll", useCallback(e => {
        updateWidth(e.ctrlKey);
    }, [updateWidth]));

    useEvent(window, "mousemove", useCallback(e => {
        updateWidth(e.ctrlKey, e.clientX)
    },[updateWidth]));

    useEvent(window, "touchmove", useCallback(e => {
        if (updateWidth(e.ctrlKey, e.touches[0].clientX) === false) return;
        e.preventDefault();
    }, [updateWidth]), false);

    useEvent(window, "mouseup", handleDragEnd);
    useEvent(window, "touchend", handleDragEnd);

    //#endregion

    Object.assign(commonProps, {
        columns
    });

    const headProps = {
        ...commonProps,
        columnResizeStart
    }

    const bodyProps = {
        ...commonProps,
        tableBodyRef,
        selectionRectRef,
        dragSelectStart,
        bodyContainerRef,
        getRowClassName,
        placeholder
    }

    return <div
        className="rst-resizingContainer"
        ref={resizingContainerRef}
        style={{
            width: widths.container + "%",
            minWidth: widths.minContainer + "px"
        }}
    >
        <ColumnGroupContext.Provider value={useObjectShallowMemo({
            refs: colGroupRefs,
            name,
            columns,
            widths
        })}>
            <HeadContainer {...headProps} />
            <BodyContainer {...bodyProps} />
        </ColumnGroupContext.Provider>
    </div>
}

export default React.memo(ResizingContainer);
