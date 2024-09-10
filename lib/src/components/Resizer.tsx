import { enableGestures } from '../utils/gestureUtils';
import useElementRef from '../hooks/useElementRef';

export enum ResizerType {
    Edge = 'rst-columnResizer',
    Column = 'rst-edgeResizer'
}

interface Props {
    index: number;
    type: ResizerType;
}

export default function Resizer({ index, type }: Props) {
    const elementRef = useElementRef();
    elementRef.useEffect(enableGestures);

    if (index === 0) return null;
    return <div className={type} ref={elementRef.set} />;
}