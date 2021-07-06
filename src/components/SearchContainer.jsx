import React from "react";
import classNames from "classnames";
import AngleIcon, {angleRotation} from "./AngleIcon";

export default function SearchContainer({ show }) {
    const className = classNames({
        "rst-searchContainer": true,
        "is-shown": show
    })

    return <div className={className}>
        <input />
        <div>1/2</div>
        <button>
            <AngleIcon rotation={angleRotation.Up} />
        </button>
        <button>
            <AngleIcon rotation={angleRotation.Down} />
        </button>
    </div>
}
