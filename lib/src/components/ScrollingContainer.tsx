import TableHead from './TableHead';
import TableBody from './TableBody';
import useElementRef from '../hooks/useElementRef';
import { gestureEventManager } from '../utils/gestureUtils';

export default function ScrollingContainer() {
    const elementRef = useElementRef();

    gestureEventManager.useListener(elementRef, 'dragStart', () => {
        console.log('Drag start');
    });

    gestureEventManager.useListener(elementRef, 'dragUpdate', () => {
        console.log('Drag update');
    });

    gestureEventManager.useListener(elementRef, 'dragEnd', () => {
        console.log('Drag end');
    });

    gestureEventManager.useListener(elementRef, 'contextMenu', () => {
        console.log('Context menu');
    });

    gestureEventManager.useListener(elementRef, 'longTap', () => {
        console.log('Long tap');
    });

    return <div className="rst-scrollingContainer" ref={elementRef.set}>
        <div className="rst-resizingContainer">
            <TableHead />
            <TableBody />
        </div>
    </div>;
}