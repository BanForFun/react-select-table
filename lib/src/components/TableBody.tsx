import { useState } from 'react';

export default function TableBody() {
    const [bodyTable] = useState<HTMLTableElement>(() => document.createElement('table'));

    return <div className="rst-body" ref={ref => ref?.append(bodyTable)} />;
}