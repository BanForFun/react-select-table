import React from 'react';
import TableHead from "./TableHead";
import ColumnGroup from "./ColumnGroup";

//Child of ResizingContainer
function HeadContainer(props) {
    return <div className="rst-headContainer">
        <table>
            <ColumnGroup columns={props.columns} name={props.name} />
            <TableHead {...props} />
        </table>
    </div>
}

export default React.memo(HeadContainer);
