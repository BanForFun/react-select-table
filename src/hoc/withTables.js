import React from 'react';
import withStore from "./withStore"
import { useTableProps } from './withTable';

export default function withTables(optionMap) {
    return Wrapped => {
        function WithTables(ownProps) {
            const props = {};

            for (let name in optionMap) {
                const options = optionMap[name];
                props[name] = useTableProps(name, options);
            }

            return <Wrapped {...ownProps} {...props} />
        }

        return withStore(WithTables);
    }
}