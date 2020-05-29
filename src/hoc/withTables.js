import React from 'react';
import withStore from "./withStore"
import { useTableProps } from './withTable';

export default function withTables(optionMap) {
    return Wrapped => {
        function WithTables(ownProps) {
            const props = {};

            for (let tableName in optionMap) {
                const options = optionMap[tableName];
                props[tableName] = useTableProps(tableName, options);
            }

            return <Wrapped {...ownProps} {...props} />
        }

        return withStore(WithTables);
    }
}