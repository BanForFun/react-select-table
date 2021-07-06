import React from 'react';

export const angleRotation = Object.freeze({
    Up: 0,
    Down: 180,
    Right: 90,
    Left: -90
});

function AngleIcon({className, rotation}) {
     return <svg
         viewBox="0 0 24.002 14.801"
         style={{ transform: `rotate(${rotation}deg)` }}
         className={"rst-icon " + className}
     >
        <path d="M23.516 11.92L11.996 0 .476 11.92a1.7 1.7 0 002.45 2.36l9.07-9.39 9.08 9.39a1.7 1.7 0 002.45-2.36z"/>
    </svg>
}

AngleIcon.defaultProps = {
    rotation: angleRotation.Up
}

export default AngleIcon
