import { useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import DLList, { DLNodeWrapper } from '../models/DLList';
import useRequiredContext from '../hooks/useRequiredContext';
import TableRow from './TableRow';
import { log } from '../utils/debugUtils';
import { Row } from '../models/state/RowSlice';
import { namedTable, table } from '../utils/iteratorUtils';
import { cachedIterator } from '../utils/iterableUtils';
import { enableGestures } from '../utils/gestureUtils';
import useConstant from '../hooks/useConstant';
import useElementRef from '../hooks/useElementRef';
import ColumnGroup from './ColumnGroup';

const keyKey = 'key';

interface RowRootNode {
    value: ReactDOM.Root;
}

function* siblingIterator(element: Element | null) {
    let current = element;
    while (current != null) {
        yield current;
        current = current.nextElementSibling;
    }
}

function getRowKey(element: Element) {
    if (!(element instanceof HTMLTableRowElement)) throw new Error('Invalid row element');
    return element.dataset[keyKey];
}

export default function TableBody<TData extends TableData>() {
    const { state, refs } = useRequiredContext(getTableContext<TData>());

    const rowRoots = useConstant(() => new DLList<RowRootNode>());
    const tableBodyRef = useElementRef<HTMLTableSectionElement>();

    const createRoot = useCallback((row: Row<TData>) => {
        const element = document.createElement('tr');
        element.classList.add('rst-row');
        element.dataset[keyKey] = state.rows.getRowKey(row);

        enableGestures({ element });

        const root = ReactDOM.createRoot(element);
        root.render(<TableRow state={state} data={row} />);

        const node: RowRootNode = { value: root };
        return { node, element };
    }, [state]);

    const appendRoot = useCallback((tableBody: HTMLTableSectionElement, row: Row<TData>) => {
        const { element, node } = createRoot(row);
        tableBody.append(element);
        rowRoots.append(node);
    }, [createRoot, rowRoots]);

    const clearRoots = useCallback((tableBody: HTMLTableSectionElement) => {
        tableBody.replaceChildren();

        const oldRootsHead = rowRoots.head.const();
        rowRoots.clear();

        setTimeout(() => {
            for (const rootNode of oldRootsHead.forwardIterator()) {
                log('Unmounting row root');
                rootNode.value.unmount();
            }
        });
    }, [rowRoots]);

    const appendRoots = useCallback((tableBody: HTMLTableSectionElement) => {
        const rows = state.visibleRows.iterator();
        for (const row of rows)
            appendRoot(tableBody, row);
    }, [state, appendRoot]);

    tableBodyRef.useEffect(useCallback(tableBody => {
        appendRoots(tableBody);
        return () => clearRoots(tableBody);
    }, [appendRoots, clearRoots]));

    tableBodyRef.useEffect(useCallback(tableBody => state.visibleRows.replaced.addObserver(() => {
        clearRoots(tableBody);
        appendRoots(tableBody);
    }), [state, appendRoots, clearRoots]));

    tableBodyRef.useEffect(useCallback(() => state.headers.rowsChanged.addObserver(() => {
        const rows = state.visibleRows.iterator();
        const rootNodes = rowRoots.head.forwardIterator();

        for (const [row, rootNode] of table(rows, rootNodes)) {
            rootNode.value.render(<TableRow state={state} data={row} />);
        }
    }), [rowRoots, state]));

    tableBodyRef.useEffect(useCallback(tableBody => state.visibleRows.added.addObserver(() => {
        const rows = state.visibleRows.iterator();
        const roots = namedTable({
            node: rowRoots.head.forwardIterator(),
            element: siblingIterator(tableBody.firstElementChild)
        });

        let row = rows.next();
        let root = roots.next();

        while (!row.done) {
            if (root.done) {
                appendRoot(tableBody, row.value);
            } else if (getRowKey(root.value.element) !== state.rows.getRowKey(row.value)) {
                const newRoot = createRoot(row.value);
                rowRoots.prepend(newRoot.node, root.value.node);
                root.value.element.before(newRoot.element);
            } else {
                root = roots.next();
            }

            row = rows.next();
        }

        if (root.done) return;

        for (const element of cachedIterator(siblingIterator(root.value.element)))
            element.remove();

        const firstUnusedRoot = new DLNodeWrapper(root.value.node);
        rowRoots.unlinkRight(root.value.node);

        setTimeout(() => {
            for (const rootNode of firstUnusedRoot.forwardIterator()) {
                log('Unmounting unused row root');
                rootNode.value.unmount();
            }
        });

    }), [appendRoot, state, createRoot, rowRoots]));

    tableBodyRef.useEffect(useCallback(tableBody => state.visibleRows.removed.addObserver(() => {
        const rows = state.visibleRows.iterator();
        const roots = namedTable({
            //Need cached iterator because we are linking the unlinked nodes into unusedRowRoots
            node: cachedIterator(rowRoots.head.forwardIterator()),
            element: cachedIterator(siblingIterator(tableBody.firstElementChild))
        });

        let row = rows.next();
        let root = roots.next();

        const unusedRowRoots = new DLList<RowRootNode>();
        while (!root.done) {
            // console.log(
            //     'Row', row.done ? '(done)' : state.rows.getRowKey(row.value), '\t',
            //     'Root', root.done ? '(done)' : getRowKey(root.value.element)
            // );

            if (row.done || getRowKey(root.value.element) !== state.rows.getRowKey(row.value)) {
                root.value.element.remove();
                rowRoots.unlink(root.value.node);
                unusedRowRoots.append(root.value.node);
            } else {
                row = rows.next();
            }

            root = roots.next();
        }

        setTimeout(() => {
            for (const rootNode of unusedRowRoots.head.forwardIterator()) {
                log('Unmounting removed row root');
                rootNode.value.unmount();
            }
        });

        while (!row.done) {
            appendRoot(tableBody, row.value);
            row = rows.next();
        }
    }), [appendRoot, rowRoots, state]));

    return <table className="rst-table rst-body">
        <ColumnGroup refMap={refs.bodyColumns} />
        {/* TODO: Add hidden thead for screen readers */}
        <tbody ref={tableBodyRef.set} />
    </table>;
}