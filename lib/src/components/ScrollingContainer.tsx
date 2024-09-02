import TableHead from './TableHead';
import TableBody from './TableBody';
import { addGestureEventListener, enableGestures } from '../utils/gestureUtils';
import { useRef } from 'react';

export default function ScrollingContainer() {
    const elementRef = useRef<HTMLElement | null>(null);


    return <div className="rst-scrollingContainer" ref={el => {
        elementRef.current = el;
        if (el == null) return;

        enableGestures(el);

        addGestureEventListener(el, 'dragStart', e => {
            console.log('Drag start');
        });

        addGestureEventListener(el, 'dragUpdate', e => {
            console.log('Drag update');
        });

        addGestureEventListener(el, 'dragEnd', e => {
            console.log('Drag end');
        });

        addGestureEventListener(el, 'contextMenu', e => {
            console.log('Context menu');
        });

        addGestureEventListener(el, 'longTap', e => {
            console.log('Long tap');
        });
    }}>
        <div className="rst-resizingContainer">
            <TableHead />
            <TableBody />
        </div>
    </div>;
}