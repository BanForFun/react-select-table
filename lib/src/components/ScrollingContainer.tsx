import TableHead from './TableHead';
import TableBody from './TableBody';
import useElementRef from '../hooks/useElementRef';
import { enableGestures } from '../utils/gestureUtils';
import { useCallback } from 'react';
import useRequiredContext from '../hooks/useRequiredContext';
import getTableContext from '../context/tableContext';
import { TableData } from '../utils/configUtils';
import useConstant from '../hooks/useConstant';

import { RelatedElements } from '../utils/elementUtils';

export default function ScrollingContainer<TData extends TableData>() {
    const { refs } = useRequiredContext(getTableContext<TData>());

    const relatedElements = useConstant<RelatedElements>(() => ({}));
    const elementRef = useElementRef();

    elementRef.useEffect(useCallback(element => {
        return enableGestures({ element, relatedElements });
    }, [relatedElements]));

    refs.head.useEffect(useCallback(element => {
        relatedElements.headerTop = element;
        return () => delete relatedElements.headerTop;
    }, [relatedElements]));

    return <div className="rst-scrollingContainer" ref={elementRef.set}>
        <div className="rst-resizingContainer">
            <TableHead />
            <TableBody />
        </div>
    </div>;
}