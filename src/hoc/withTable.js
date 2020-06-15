import React from 'react';
import withStore from "./withStore"
import useTable from "../hooks/useTable";

export const TableNameContext = React.createContext();
TableNameContext.displayName = "TableName";

export default function withTable(name, options = null) {
    return Wrapped => {
        function WithTable(ownProps) {
            const props = useTable(name, options);

            return <TableNameContext.Provider value={name}>
                <Wrapped {...ownProps} {...props} />
            </TableNameContext.Provider>
        }

        return withStore(WithTable);
    }
}
