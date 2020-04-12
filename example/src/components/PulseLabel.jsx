import React, { useEffect, useRef } from 'react';

function PulseLabel({ title, items }) {
    const titleRef = useRef();

    useEffect(() => {
        const titleEl = titleRef.current;

        titleEl.className = "";
        titleEl.focus();
        titleEl.className = "change";
    }, [items]);

    return <React.Fragment>
        <b ref={titleRef}>{title}</b>
        <p>{items.join(", ")}</p>
    </React.Fragment>
}

export default PulseLabel;