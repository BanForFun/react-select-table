import React from 'react';
import TableHead from "./TableHead";
import ColumnGroup from "./ColumnGroup";

//Child of ResizingContainer
function HeadContainer(props) {
    const {
        tableClass,
        ...headProps
    } = props;

    return <div className="rst-headContainer">
        <table className={tableClass}>
            <ColumnGroup id="head" />
            <TableHead {...headProps} />
        </table>
    </div>
}

export default React.memo(HeadContainer);
