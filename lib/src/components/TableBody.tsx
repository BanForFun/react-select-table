import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import getTableContext from '../context/controllerContext';
import { TableData } from '../utils/configUtils';
import DoublyLinkedList, { DoublyLinkedNodeWrapper } from '../models/DoublyLinkedList';
import useRequiredContext from '../hooks/useRequiredContext';
import TableRow from './TableRow';
import { log } from '../utils/debugUtils';
import { Row } from '../models/state/RowState';
import { namedTable, table } from '../utils/iteratorUtils';
import { getIterator } from '../utils/iterableUtils';

interface RowRootNode {
    value: ReactDOM.Root;
}

export default function TableBody<TData extends TableData>() {
    const { controller, callbacks } = useRequiredContext(getTableContext<TData>());

    const [tableBody] = useState<HTMLTableSectionElement>(() => document.createElement('tbody'));
    const [rowRoots] = useState(() => new DoublyLinkedList<RowRootNode>());

    callbacks.updateColumns = updates => {
        if (!updates.length) return;

        const rows = controller.state.visibleRows.iterator();
        const rootNodes = rowRoots.head.forwardIterator();

        for (const [row, rootNode] of table(rows, rootNodes)) {
            rootNode.value.render(<TableRow controller={controller} data={row} />);
        }
    };

    const createRoot = useCallback((row: Row<TData>) => {
        const element = document.createElement('tr');
        element.dataset.key = controller.state.rows.getRowKey(row);

        const root = ReactDOM.createRoot(element);
        root.render(<TableRow controller={controller} data={row} />);

        const node: RowRootNode = { value: root };
        return { node, element };
    }, [controller]);

    const appendRoot = useCallback((row: Row<TData>) => {
        const { element, node } = createRoot(row);
        tableBody.append(element);
        rowRoots.append(node);
    }, [createRoot, rowRoots, tableBody]);

    const appendRoots = useCallback(() => {
        const rows = controller.state.visibleRows.iterator();
        for (const row of rows) appendRoot(row);
    }, [controller, appendRoot]);

    const clearRoots = useCallback(() => {
        const oldRootsHead = rowRoots.head.persist();
        rowRoots.clear();
        tableBody.innerHTML = '';

        setTimeout(() => {
            for (const rootNode of oldRootsHead.forwardIterator()) {
                log('Unmounting root');
                rootNode.value.unmount();
            }
        });
    }, [rowRoots, tableBody]);

    useEffect(() => controller.state.visibleRows.changed.addObserver(() => {
        clearRoots();
        appendRoots();
    }), [controller, appendRoots, clearRoots]);

    useEffect(() => controller.state.visibleRows.added.addObserver(() => {
        const rows = controller.state.visibleRows.iterator();
        const roots = namedTable({
            node: rowRoots.head.forwardIterator(),
            element: getIterator(tableBody.rows)
        });

        let row = rows.next();
        let root = roots.next();

        while (!row.done) {
            if (root.done) {
                appendRoot(row.value);
            } else if (root.value.element.dataset.key !== controller.state.rows.getRowKey(row.value)) {
                const newRoot = createRoot(row.value);
                rowRoots.prepend(newRoot.node, root.value.node);
                root.value.element.before(newRoot.element);
            } else {
                root = roots.next();
            }

            row = rows.next();
        }

        if (root.done) return;

        let element: Element | null = root.value.element;
        while (element != null) {
            const nextElement: Element | null = element.nextElementSibling;
            element.remove();
            element = nextElement;
        }

        const node = new DoublyLinkedNodeWrapper(root.value.node);
        rowRoots.order(node.previous, null);

        setTimeout(() => {
            for (const rootNode of node.forwardIterator()) {
                log('Unmounting unused row root');
                rootNode.value.unmount();
            }
        });

    }), [appendRoot, controller, createRoot, rowRoots, tableBody]);

    useLayoutEffect(() => {
        appendRoots();
        return clearRoots;
    }, [appendRoots, clearRoots]);

    return <div className="rst-body">
        <table ref={ref => ref?.append(tableBody)} />
    </div>;
}