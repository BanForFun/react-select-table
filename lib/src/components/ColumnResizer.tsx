import { enableGestures, gestureEventManager } from '../utils/gestureUtils';
import useElementRef from '../hooks/useElementRef';
import { useCallback, useRef } from 'react';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import { unit } from '../utils/unitUtils';
import { filter, getIterator, map } from '../utils/iterableUtils';
import { getLeafHeaders, ReadonlyHeader } from '../models/state/HeaderSlice';
import DragAnimationManager, { AnimateCallback } from '../models/DragAnimationManager';
import useAnimationCallback from '../hooks/useAnimationCallback';
import { table } from '../utils/iteratorUtils';
import { sum } from '../utils/numericUtils';

export enum ResizerType {
    Edge = 'rst-edgeResizer',
    Normal = 'rst-columnResizer'
}

interface Props<TData extends TableData> {
    header?: ReadonlyHeader<TData>;
    type: ResizerType;
}

class ColumnCollection {
    readonly widthFactors: number[];
    totalWidth: number;

    constructor(public readonly elements: HTMLTableColElement[]) {
        const widths = elements.map(c => c.getBoundingClientRect().width);
        this.totalWidth = sum(widths);
        this.widthFactors = widths.map(w => w / this.totalWidth);
    }

    getWidths() {
        return this.widthFactors.map(f => this.totalWidth * f);
    }
}

interface Resizing {
    animationManager: DragAnimationManager;
    leftColumns: ColumnCollection;
    rightColumns: ColumnCollection;
}

function isColumnCollapsed(column: HTMLTableColElement) {
    return getComputedStyle(column).display === 'none';
}

function freezeColumn(column: HTMLTableColElement) {
    column.style.width = unit(column.getBoundingClientRect().width, 'px');
}

function findVisibleColumnsLeft(header: Element | null, column: Element | null) {
    const columns: HTMLTableColElement[] = [];
    while (header instanceof HTMLTableCellElement) {
        for (let i = 0; i < header.colSpan; i++) {
            if (!(column instanceof HTMLTableColElement))
                throw new Error('No column definition found for header');

            if (!isColumnCollapsed(column))
                columns.push(column);

            column = column.previousElementSibling;
        }

        if (columns.length) break;
        header = header.previousElementSibling;
    }

    return columns.reverse();
}

export default function ColumnResizer<TData extends TableData>(props: Props<TData>) {
    const { header, type } = props;

    const { state, refs } = useRequiredContext(getTableContext<TData>());

    const resizingRef = useRef<Resizing | null>(null);
    const elementRef = useElementRef();

    elementRef.useEffect(useCallback(element => {
        enableGestures({ element, rotateScroll: true, enableDrag: true });
    }, []));

    const animate: AnimateCallback = useAnimationCallback(useCallback((params) => {
        const {
            clientPosition,
            scrollDelta,
            target
        } = params;

        const {
            leftColumns
        } = resizingRef.current!;

        const leftOffset = leftColumns.elements[0].getBoundingClientRect().left;
        leftColumns.totalWidth = Math.max(0, clientPosition.x - leftOffset);

        for (const [column, width] of table(getIterator(leftColumns.elements), getIterator(leftColumns.getWidths()))) {
            column.style.width = unit(width, 'px');
        }

        target.scrollLeft += scrollDelta.x;
        target.scrollTop += scrollDelta.y;
    }, []));

    gestureEventManager.useListener(elementRef, 'dragStart', e => {
        const rightColumns = header ? Array.from(filter(
            map(getLeafHeaders(header), l => refs.headColumns.get(l)),
            c => !isColumnCollapsed(c)
        )) : [refs.headColumns.spacer];

        if (rightColumns.length === 0)
            return e.preventDefault();

        const leftColumns = findVisibleColumnsLeft(
            elementRef.value!.parentElement!.previousElementSibling,
            rightColumns[0].previousElementSibling
        );

        if (leftColumns.length === 0)
            return e.preventDefault();

        for (const column of refs.headColumns.getAll())
            freezeColumn(column);

        for (const column of refs.bodyColumns.getAll())
            freezeColumn(column);

        resizingRef.current = {
            animationManager: new DragAnimationManager(e, animate),
            leftColumns: new ColumnCollection(leftColumns),
            rightColumns: new ColumnCollection(rightColumns)
        };
    });

    gestureEventManager.useListener(elementRef, 'dragUpdate', function(e) {
        resizingRef.current!.animationManager.update(e);
    });

    gestureEventManager.useListener(elementRef, 'dragEnd', () => {
        resizingRef.current!.animationManager.cancel(() => {
            state.headerSizes.set(0, []);
            resizingRef.current = null;
        });
    });

    return <div className={type} ref={elementRef.set} />;
}