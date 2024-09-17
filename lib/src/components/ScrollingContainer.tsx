import TableHead from './TableHead';
import TableBody from './TableBody';
import useElementRef from '../hooks/useElementRef';
import { enableGestures, GestureTarget } from '../utils/gestureUtils';
import { useCallback } from 'react';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import useConstant from '../hooks/useConstant';

export default function ScrollingContainer<TData extends TableData>() {
    const { refs } = useRequiredContext(getTableContext<TData>());

    const gestureTarget = useConstant<Partial<GestureTarget>>(() => ({}));
    const elementRef = useElementRef();

    elementRef.useEffect(useCallback(element => {
        return enableGestures(Object.assign(gestureTarget, { element }));
    }, [gestureTarget]));

    refs.head.useEffect(useCallback(element => {
        gestureTarget.headerTop = element;
        return () => delete gestureTarget.headerTop;
    }, [gestureTarget]));

    return <div className="rst-scrollingContainer" ref={elementRef.set}>
        <div className="rst-resizingContainer">
            <TableHead />
            <TableBody />
        </div>
    </div>;
}