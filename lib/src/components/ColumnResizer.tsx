import { enableGestures, gestureEventManager } from '../utils/gestureUtils';
import useElementRef from '../hooks/useElementRef';
import { useCallback, useRef } from 'react';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import { unit } from '../utils/unitUtils';
import { filter, map } from '../utils/iterableUtils';
import { getLeafHeaders, ReadonlyHeader } from '../models/state/HeaderSlice';
import DragAnimationManager, { AnimateCallback } from '../models/DragAnimationManager';
import useAnimationCallback from '../hooks/useAnimationCallback';

export enum ResizerType {
    Edge = 'rst-edgeResizer',
    Normal = 'rst-columnResizer'
}

interface Props<TData extends TableData> {
    header?: ReadonlyHeader<TData>;
    type: ResizerType;
}

function freezeColumn(column: HTMLTableColElement) {
    column.style.width = unit(column.offsetWidth, 'px');
}


export default function ColumnResizer<TData extends TableData>(props: Props<TData>) {
    const { header, type } = props;

    const { state, refs } = useRequiredContext(getTableContext<TData>());

    const animationManagerRef = useRef<DragAnimationManager | null>(null);
    const elementRef = useElementRef();

    elementRef.useEffect(useCallback(element => {
        enableGestures({ element, rotateScroll: true, enableDrag: true });
    }, []));

    const animate: AnimateCallback = useAnimationCallback(useCallback((relativePosition, panDelta, scrollDelta) => {
        if (elementRef.value == null) return;

        const rightColumns = header ? Array.from(filter(
            map(getLeafHeaders(header), l => refs.headColumns.get(l)),
            c => c.clientWidth > 0
        )) : [refs.headColumns.spacer];

        let leftColumn = rightColumns[0].previousElementSibling;
        let leftHeader = elementRef.value.parentElement?.previousElementSibling;
        const leftColumns: Element[] = [];

        while (!leftColumns.length && leftHeader instanceof HTMLTableCellElement) {
            for (let i = 0; i < leftHeader.colSpan; i++) {
                if (leftColumn == null)
                    throw new Error('No column definition found for header');

                if (leftColumn.clientWidth === 0)
                    continue;

                leftColumns.push(leftColumn);
                leftColumn = leftColumn.previousElementSibling;
            }

            leftHeader = leftHeader.previousElementSibling;
        }

        if (!leftColumns.length) return;

        console.log(relativePosition, panDelta, scrollDelta);
    }, [elementRef, header, refs]));

    gestureEventManager.useListener(elementRef, 'dragStart', e => {
        console.log('Drag start');

        for (const column of refs.headColumns.getAll())
            freezeColumn(column);

        for (const column of refs.bodyColumns.getAll())
            freezeColumn(column);

        animationManagerRef.current = new DragAnimationManager(e, animate);
    });

    gestureEventManager.useListener(elementRef, 'dragUpdate', function(e) {
        animationManagerRef.current!.update(e);
    });

    gestureEventManager.useListener(elementRef, 'dragEnd', () => {
        console.log('Drag end');

        animationManagerRef.current!.cancel(() => {
            state.headerSizes.set(0, []);
        });

        animationManagerRef.current = null;
    });

    return <div className={type} ref={elementRef.set} />;
}