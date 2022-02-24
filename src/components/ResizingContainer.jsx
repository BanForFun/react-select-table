import React, {useMemo, useContext} from 'react';
import _ from "lodash";
import HeadContainer from "./HeadContainer";
import BodyContainer from "./BodyContainer";
import {ColumnGroupContext} from "./ColumnGroup";

//Child of ScrollingContainer
function ResizingContainer(props) {
    const {
        resizingContainerRef,

        //HeadContainer props
        scrollingContainerRef,
        headColGroupRef,
        columnResizeStart,

        //BodyContainer props
        getRowClassName,
        selectionRectRef,
        tableBodyRef,
        bodyContainerRef,
        setDragSelectionOriginIndex,
        placeholder,

        ...commonProps
    } = props;

    const {minColumnWidth} = props.utils.options;

    const headProps = {
        ...commonProps,
        headColGroupRef,
        scrollingContainerRef,

        columnResizeStart
    }

    const bodyProps = {
        ...commonProps,
        tableBodyRef,
        selectionRectRef,
        bodyContainerRef,

        getRowClassName,
        setDragSelectionOriginIndex,
        placeholder
    }

    const { containerWidth, containerMinWidth } = useContext(ColumnGroupContext);

    return <div
        className="rst-resizingContainer"
        ref={resizingContainerRef}
        style={{ width: containerWidth, minWidth: containerMinWidth }}
    >
        <HeadContainer {...headProps} />
        <BodyContainer {...bodyProps} />
    </div>
}

export default React.memo(ResizingContainer);
