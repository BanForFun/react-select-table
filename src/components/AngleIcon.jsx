import React from 'react';

export const angleRotation = Object.freeze({
    Up: 0,
    Down: 180,
    Right: 90,
    Left: -90
});

function AngleIcon({className, rotation}) {
     return <svg
         viewBox="0 0 24.002 24.002"
         style={{ transform: `rotate(${rotation}deg)` }}
         className={"rst-icon " + className}
     >
         <path d="M23.516 16.52L11.996 4.6.476 16.52a1.7 1.7 0 002.45 2.36l9.07-9.39 9.08 9.39a1.7 1.7 0 002.45-2.36z" />
    </svg>
}

AngleIcon.defaultProps = {
    rotation: angleRotation.Up,
    className: ""
}

export default AngleIcon
