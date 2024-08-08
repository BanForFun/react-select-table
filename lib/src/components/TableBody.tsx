import { useContext, useLayoutEffect, useState } from 'react';
import getTableContext from '../context/controllerContext';
import { TableData } from '../utils/configUtils';

export default function TableBody<TData extends TableData>() {
    const { controller, callbacks } = useContext(getTableContext<TData>());

    const [tableBody] = useState<HTMLTableSectionElement>(() => document.createElement('tbody'));

    callbacks.updateBody = updates => {
        // for (const update of updates) {
        // if ('addedPosition' in update) {
        //
        // } else {
        //
        // }
        // }
    };

    useLayoutEffect(() => {
        tableBody.innerHTML = '';

    }, [controller, tableBody]);

    return <div className="rst-body">
        <table ref={ref => ref?.append(tableBody)} />
    </div>;
}