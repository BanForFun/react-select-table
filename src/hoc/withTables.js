import React from 'react';
import withStore from "./withStore"
import { useTableProps } from './withTable';

export default function withTables(optionMap) {
    return Wrapped => {
        function WithTables(ownProps) {
            const props = {};

            for (let namespace in optionMap) {
                const options = optionMap[namespace];
                props[namespace] = useTableProps(namespace, options);
            }

            return <Wrapped {...ownProps} {...props} />
        }

        return withStore(WithTables);
    }
}