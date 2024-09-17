import { enableGestures } from '../utils/gestureUtils';
import useElementRef from '../hooks/useElementRef';
import { useCallback } from 'react';

export enum ResizerType {
    Edge = 'rst-edgeResizer',
    Normal = 'rst-columnResizer'
}

interface Props {
    type: ResizerType;
}

export default function ColumnResizer({ type }: Props) {
    const elementRef = useElementRef();
    elementRef.useEffect(useCallback(element => {
        enableGestures({ element, rotateScroll: true });
    }, []));

    return <div className={type} ref={elementRef.set} />;
}