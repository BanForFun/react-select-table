import React, {useContext, useLayoutEffect, useMemo, useRef} from "react";
import _ from "lodash"
import TableRow from "./TableRow";
import ColumnGroupContext from "../context/ColumnGroup";
import ColGroup from "./ColGroup";

export const VisibleChunkClass = "rst-visible";

function TableChunk(props) {
    const {
        utils: { options, hooks, selectors },
        getRowClassName,
        rows,
        index,
        chunkIntersectionObserver,
        clipPath,
        getContainerVisibleBounds,

        ...rowCommonProps
    } = props;

    const {
        columns,
        name
    } = props;

    const chunkIndexOffset = index * options.chunkSize;
    const selection = hooks.useSelector(s => s.selection);
    const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex);

    const { widths, resizingIndex } = useContext(ColumnGroupContext);

    const chunkRef = useRef();

    useLayoutEffect(() => {
        const chunk = chunkRef.current;
        // chunk.style.setProperty("--contain-intrinsic-size", px(chunk.offsetHeight));

        const observer = chunkIntersectionObserver.current;
        // //observer will be null if browser supports content-visibility property
        if (!observer) {
            //     chunk.style["content-visibility"] = "auto";
            return;
        }

        observer.observe(chunk);
        return () => observer.unobserve(chunk);
    }, [chunkIntersectionObserver]);

    const isClipped = useMemo(() => {
        if (resizingIndex == null) return false;

        const chunk = chunkRef.current;
        const chunkTop = chunk.offsetTop;
        const chunkBottom = chunkTop + chunk.offsetHeight;

        const clipPath = getContainerVisibleBounds();
        return chunkBottom < clipPath.top || chunkTop > clipPath.bottom;
    }, [resizingIndex, getContainerVisibleBounds]);

    //While resizing columns, hide chunks that are not visible
    //but would be rendered because they are in the observer's margin
    //Note: Not just performance related. ColGroups of clipped chunks will not be updated with the pixel widths
    //and if rendered with the .rst-visible style they become huge and break the layout
    useLayoutEffect(() => {
        const chunk = chunkRef.current;
        if (!isClipped || !chunk.classList.contains(VisibleChunkClass)) return;

        const observer = chunkIntersectionObserver.current;
        observer.unobserve(chunk);
        chunk.classList.remove(VisibleChunkClass);

        return () => observer.observe(chunk);
    }, [chunkIntersectionObserver, isClipped]);

    const renderRow = (rowData, rowIndex) => {
        const rowValue = _.get(rowData, options.valueProperty);
        rowIndex += chunkIndexOffset;

        const rowProps = {
            ...rowCommonProps,
            key: `row_${props.name}_${rowValue}`,
            data: rowData, value: rowValue, index: rowIndex,
            active: rowIndex === activeRowIndex,
            selected: selection.has(rowValue),
            className: getRowClassName(rowData)
        };

        return <TableRow {...rowProps} />;
    };

    return <table className="rst-chunk" ref={chunkRef}>
        <ColGroup {...{ name, columns, widths, isClipped }}/>
        <tbody className="rst-rows">{rows.map(renderRow)}</tbody>
    </table>
}

export default React.memo(TableChunk);
