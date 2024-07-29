import { useRef, useState } from 'react';

function TableBody() {
    const [table] = useState<HTMLTableElement>(() => document.createElement('table'));

    const [count, setCount] = useState(0);

    return <div className="rst-body" ref={ref => ref?.append(table)}>
        <button onClick={() => setCount(count + 1)}>{count}</button>
    </div>;


}

export default TableBody;