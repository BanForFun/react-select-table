export enum Rotation {
    Up = 0,
    Down = 180,
    Right = 90,
    Left = -90
}

export interface AngleIconProps {
    rotation: Rotation;
}

export default function AngleIcon({ rotation }: AngleIconProps) {
    return <svg className="rst-icon" viewBox="0 0 24 24" style={{ transform: `rotate(${rotation}deg)` }}>
        <path
            d="M 23.514324,16.51929 11.995,4.5999889 0.47567595,16.51929 A 1.7007899,1.7007899 0 0 0 2.9255324,18.879152 L 11.995,9.4897022 21.074467,18.879152 a 1.7007901,1.7007901 0 0 0 2.449857,-2.359862 z" />
    </svg>;
}