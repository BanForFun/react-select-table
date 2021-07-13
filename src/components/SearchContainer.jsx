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

    const isVisible = phrase !== null;

    const goToAdjacentMatch = useCallback((offset) =>
        actions.goToMatch(matchIndex + offset),
        [actions, matchIndex]);

    const handleChange = useCallback(e => {
        actions.search(e.currentTarget.value);
    }, [actions]);

    const handleKeyDown = useCallback(e => {
        if (!isVisible) return;
        e.stopPropagation();

        switch (e.keyCode) {
            case 38: //Up
                goToAdjacentMatch(-1);
                break;
            case 40: //Down
                goToAdjacentMatch(1);
                break;
            case 27: //Escape
                actions.search(null);
                break;
            default:
                return;
        }

        e.preventDefault();
    }, [actions, goToAdjacentMatch, isVisible]);

    const handleBlur = useCallback(e => {
        if (!isVisible) return;
        if (e.currentTarget.contains(e.relatedTarget)) return;
        actions.search(null);
    }, [actions, isVisible]);

    const className = classNames({
        "rst-searchContainer": true,
        "is-visible": isVisible
    });

    return <div className={className} onBlur={handleBlur}>
        <div className="rst-search">
            <input
                value={phrase || ""}
                ref={inputRef}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
            />
            <div>{matchCount && (matchIndex + 1)}/{matchCount}</div>

            <button tabIndex="-1" onClick={() => goToAdjacentMatch(-1)}>
                <AngleIcon rotation={angleRotation.Up} />
            </button>

            <button tabIndex="-1" onClick={() => goToAdjacentMatch(1)}>
                <AngleIcon rotation={angleRotation.Down} />
            </button>
        </div>
    </div>
}

export default React.memo(SearchContainer);
