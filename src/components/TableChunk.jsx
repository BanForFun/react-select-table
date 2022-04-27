import React, {useContext, useLayoutEffect, useMemo, useRef} from "react";
import _ from "lodash"
import TableRow from "./TableRow";
import ColumnGroupContext from "../context/ColumnGroup";
import ColGroup from "./ColGroup";

function TableChunk(props) {
    const {
        utils: { options, hooks, selectors },
        getRowClassName,
        rows,
        index,
        chunkIntersectionObserver,
        clipPath,

        ...rowCommonProps
    } = props;

    const {
        columns,
        name
    } = props;

    const chunkIndexOffset = index * options.chunkSize;
    const selection = hooks.useSelector(s => s.selection);
    const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex);

    const { widths } = useContext(ColumnGroupContext);

    const chunkRef = useRef();

    const isClipped = useMemo(() => {
        if (!clipPath) return false;

        const chunk = chunkRef.current;
        const chunkTop = chunk.offsetTop;
        const chunkBottom = chunkTop + chunk.offsetHeight;
        return chunkBottom < clipPath.top || chunkTop > clipPath.bottom;
    }, [clipPath]);

    useLayoutEffect(() => {
        if (isClipped) return;

        const chunk = chunkRef.current;
        chunk.classList.add("rst-heightInvalid");
    }, [isClipped, rows, widths, columns]);

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
