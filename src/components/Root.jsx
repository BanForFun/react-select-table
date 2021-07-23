import React, {useRef, useEffect, useCallback, useMemo} from 'react';
import ScrollingContainer from "./ScrollingContainer";
import PaginationContainer from "./PaginationWrapper";
import {relativePos, specialValues} from "../models/Actions";
import SearchContainer from "./SearchContainer";

//Child of Connector
function Root(props) {
    const {
        Pagination, //PaginationContainer
        onContextMenu,
        onKeyDown,
        containerRef,
        id,
        className,
        autoFocus,
        loadingIndicator,
        emptyPlaceholder,
        Error,
        ...scrollingProps
    } = props;

    const {
        utils: { hooks, options, selectors },
        onItemsOpen
    } = props;

    useEffect(() => {
        if (!autoFocus) return;
        containerRef.current.focus();
    }, []);

    const actions = hooks.useActions();

    const tableBodyRef = useRef();
    const searchInputRef = useRef();

    const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex);
    const pageSize = hooks.useSelector(s => s.pageSize);
    const isPageFirst = hooks.useSelector(selectors.isPageFirst);
    const isPageLast = hooks.useSelector(selectors.isPageLast);
    const isActiveItemFirst = hooks.useSelector(selectors.isActiveItemFirst);
    const isActiveItemLast = hooks.useSelector(selectors.isActiveItemLast);
    const activeValue = hooks.useSelector(selectors.getActiveValue);
    const selection = hooks.useSelector(s => s.selection);
    const isLoading = hooks.useSelector(s => s.isLoading);
    const error = hooks.useSelector(s => s.error);
    const isEmpty = hooks.useSelector(s => !s.visibleItemCount);

    const getSelectionArg = hooks.useSelectorGetter(selectors.getSelectionArg);

    const placeholder = useMemo(() => {
        const props = {
            className: "rst-bodyPlaceholder"
        };
        let content;

        if (isLoading)
            content = loadingIndicator;
        else if (error)
            content = <Error>{error}</Error>;
        else if (isEmpty) {
            content = emptyPlaceholder;
            props.onContextMenu = () => onContextMenu(null);
        } else
            return;

        return <div {...props}>{content}</div>
    }, [isLoading, error, isEmpty, onContextMenu]);

    const placeholderShown = !!placeholder;

    const offsetPage = useCallback((e, prev) => {
        if (!e.ctrlKey && !e.shiftKey) {
            const relPos = prev ? relativePos.Prev : relativePos.Next;
            actions.goToPageRelative(relPos);
        } else {
            const offset = prev ? -pageSize : pageSize;
            actions.selectRelative(e, offset);
        }
    }, [actions, pageSize]);

    const handleShortcuts = useCallback(e => {
        if (placeholderShown) return false;
        if (onKeyDown(e, getSelectionArg()) === false) return false;

        switch (e.keyCode) {
            case 65: //A
                if (!e.ctrlKey || e.shiftKey || !options.multiSelect) return;
                actions.selectAll();
                break;
            case 38: //Up
                if (isActiveItemFirst) break;
                actions.selectRelative(e, -1);
                break;
            case 40: //Down
                if (isActiveItemLast) break;
                actions.selectRelative(e, 1);
                break;
            case 36: //Home
                if (isActiveItemFirst) break;
                actions.selectRelative(e, 0, specialValues.FirstItem);
                break;
            case 35: //End
                if (isActiveItemLast) break;
                actions.selectRelative(e, 0, specialValues.LastItem);
                break;
            case 13: //Enter
                if (!e.ctrlKey && !e.shiftKey && selection.has(activeValue))
                    onItemsOpen(getSelectionArg(), true);
                else
                    actions.select(e, activeRowIndex);

                break;
            case 37: //Left
                if (isPageFirst) break;
                offsetPage(e, true);
                break;
            case 39: //Right
                if (isPageLast) break;
                offsetPage(e, false);
                break;
            default:
                return;
        }

        e.preventDefault();
        return false;
    }, [
        actions, options, onKeyDown, placeholderShown,
        activeRowIndex, selection, activeValue, //Redux props
        isPageFirst, isPageLast, isActiveItemLast, isActiveItemFirst, //Redux props
        getSelectionArg, //Redux selectors
        offsetPage, //Component methods
        onItemsOpen, //Event handlers
    ]);

    const handleKeyDown = useCallback(e => {
        if (handleShortcuts(e) === false) return;
        searchInputRef.current.focus();
    }, [handleShortcuts, searchInputRef])

    //Scrolling container props
    Object.assign(scrollingProps, {
        actions,
        tableBodyRef,
        placeholder
    });

    //Pagination container props
    const paginationProps = {
        utils: props.utils,
        actions,
        Pagination,
        placeholderShown
    }

    const searchProps = {
        utils: props.utils,
        actions,
        inputRef: searchInputRef
    }

    return <div
        tabIndex="0"
        id={id}
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className={"rst-container " + className}
        // onFocus={() => }
    >
        <SearchContainer {...searchProps} />
        <ScrollingContainer {...scrollingProps} />
        {!placeholderShown && !!pageSize && <PaginationContainer {...paginationProps} />}
    </div>
}

export default React.memo(Root);
