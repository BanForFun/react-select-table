import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import getTableContext from '../context/controllerContext';
import { TableData } from '../utils/configUtils';
import DoublyLinkedList, { DoublyLinkedNode } from '../models/DoublyLinkedList';
import useRequiredContext from '../hooks/useRequiredContext';
import TableRow from './TableRow';

interface RowRoot extends DoublyLinkedNode<RowRoot> {
    root: ReactDOM.Root;
}

export default function TableBody<TData extends TableData>() {
    const { controller, callbacks } = useRequiredContext(getTableContext<TData>());

    const [tableBody] = useState<HTMLTableSectionElement>(() => document.createElement('tbody'));
    const [rowRoots] = useState(() => new DoublyLinkedList<RowRoot>());

    callbacks.updateColumns = () => {
        const rows = controller.state.rows.currentPageIterator();
        const roots = rowRoots.head.nextIterator();

        let rowNode = rows.next();
        let rootNode = roots.next();

        while (!rowNode.done && !rootNode.done) {
            rootNode.value.root.render(<TableRow controller={controller} data={rowNode.value.data} />);

            rowNode = rows.next();
            rootNode = roots.next();
        }
    };

    const addRoots = useCallback(() => {
        const rows = controller.state.rows.currentPageIterator();
        for (const rowNode of rows) {
            const row = tableBody.insertRow();
            const root = ReactDOM.createRoot(row);
            root.render(<TableRow controller={controller} data={rowNode.data} />);

            rowRoots.append({
                root,
                next: null,
                previous: null
            });
        }
    }, [controller, rowRoots, tableBody]);

    const clearRoots = useCallback(() => {
        const oldRootsHead = rowRoots.head.persist();
        rowRoots.clear();
        tableBody.innerHTML = '';

        setTimeout(() => {
            for (const rootNode of oldRootsHead.nextIterator()) {
                console.log('Unmounting root');
                rootNode.root.unmount();
            }
        });
    }, [rowRoots, tableBody]);

    useEffect(() => {
        return controller.state.rows.refreshPage.addObserver(() => {
            clearRoots();
            addRoots();
        });
    }, [controller, addRoots, clearRoots]);

    useLayoutEffect(() => {
        addRoots();
        return clearRoots;
    }, [addRoots, clearRoots]);

    return <div className="rst-body">
        <table ref={ref => ref?.append(tableBody)} />
    </div>;
}