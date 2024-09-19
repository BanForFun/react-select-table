import { enableGestures, gestureEventManager } from '../utils/gestureUtils';
import useElementRef from '../hooks/useElementRef';
import { useCallback } from 'react';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import { unit } from '../utils/unitUtils';

export enum ResizerType {
    Edge = 'rst-edgeResizer',
    Normal = 'rst-columnResizer'
}

interface Props {
    height: number;
    index: number;
    type: ResizerType;
}

function freezeColumn(column: HTMLTableColElement) {
    column.style.width &&= unit(column.offsetWidth, 'px');
}

export default function ColumnResizer<TData extends TableData>(props: Props) {
    const { index, height, type } = props;

    const { state, refs } = useRequiredContext(getTableContext<TData>());

    const elementRef = useElementRef();
    elementRef.useEffect(useCallback(element => {
        enableGestures({ element, rotateScroll: true, enableDrag: true });
    }, []));

    gestureEventManager.useListener(elementRef, 'dragStart', function(e) {
        console.log('Drag start');

        for (const column of refs.headColumns.values())
            freezeColumn(column);

        for (const column of refs.bodyColumns.values())
            freezeColumn(column);
    });

    gestureEventManager.useListener(elementRef, 'dragEnd', function(e) {
        console.log('Drag end');

        state.headerSizes.set(0, []);
    });

    if (index < 0) return null;

    return <div className={type} ref={elementRef.set} />;
}