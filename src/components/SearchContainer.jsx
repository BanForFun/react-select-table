import React, {useCallback} from "react";
import classNames from "classnames";
import AngleIcon, {angleRotation} from "./AngleIcon";

function SearchContainer(props) {
    const {
        table: { utils },
        inputRef,
        actions
    } = props;

    const phrase = utils.useSelector(s => s.searchPhrase);
    const matchCount = utils.useSelector(s => s.matches.length);
    const matchIndex = utils.useSelector(s => s.matchIndex);

    const className = classNames({
        "rst-searchContainer": true,
        "is-shown": !!phrase
    });

    const handleChange = useCallback(e => {
        actions.search(e.currentTarget.value);
    }, [actions]);

    const handleKeyDown = useCallback(e => {
        if (!e.currentTarget.value) return;
        e.stopPropagation();

        switch (e.keyCode) {
            case 38: //Up

                break;
            case 40: //Down

                break;
            case 27: //Escape
                actions.search("");
                break;
            default:
                return;
        }

        e.preventDefault();
    }, [actions]);

    return <div className={className}>
        <input
            ref={inputRef}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            value={phrase}
        />
        <div>{matchCount && (matchIndex + 1)}/{matchCount}</div>
        <button tabIndex="-1">
            <AngleIcon rotation={angleRotation.Up} />
        </button>
        <button tabIndex="-1">
            <AngleIcon rotation={angleRotation.Down} />
        </button>
    </div>
}

export default React.memo(SearchContainer);
