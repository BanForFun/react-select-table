import React, {useRef, useEffect, useCallback, useMemo} from 'react';
import {defaultEvents} from "../utils/tableUtils";
import ScrollingContainer from "./ScrollingContainer";
import PaginationContainer from "./PaginationWrapper";
import {relativePos, originValues} from "../store/table";
import SearchContainer from "./SearchContainer";

//Child of Connector
function Root(props) {
    const {
        Pagination, //PaginationContainer
        onContextMenu,
        onSelectionChange,
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
        table: { utils, events, options, selectors },
        onItemsOpen
    } = props;

    useEffect(() => {
        if (!autoFocus) return;
        containerRef.current.focus();
    }, []);

    const actions = utils.useActions();

    const tableBodyRef = useRef();
    const searchInputRef = useRef();

    //Register redux event handlers
    for (let event in defaultEvents) {
        const handler = props[event];

        useEffect(() => {
            events[event] = handler;
        }, [handler, events]);
    }

    const activeIndex = utils.useSelector(s => s.activeIndex);
    const pageSize = utils.useSelector(s => s.pageSize);
    const pageCount = utils.useSelector(selectors.getPageCount);
    const rowValues = utils.useSelector(s => s.rowValues);
    const selection = utils.useSelector(s => s.selection);
    const pageIndex = utils.useSelector(s => s.pageIndex);
    const isLoading = utils.useSelector(s => s.isLoading);
    const error = utils.useSelector(s => s.error);
    const isEmpty = utils.useSelector(s => !s.visibleItemCount);

    const getSelectionArg = utils.useSelectorGetter(selectors.getSelectionArg);

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
            // const origin = prev ? originValues.FirstRow : originValues.LastRow;
            // const offset = prev ? -pageSize : 1;
            const offset = prev ? -pageSize : pageSize;
            actions.selectRelative(e, offset);
        }
    }, [actions, pageSize]);

    const handleShortcuts = useCallback(e => {
        if (placeholderShown) return false;
        if (onKeyDown(e, getSelectionArg()) === false) return false;

        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pageCount - 1;

        const isFirstItem = isFirstPage && activeIndex === 0;
        const isLastItem = isLastPage && activeIndex === rowValues.length - 1;

        switch (e.keyCode) {
            case 65: //A
                if (!e.ctrlKey || e.shiftKey || !options.multiSelect) return;
                actions.selectAll();
                break;
            case 38: //Up
                if (isFirstItem) break;
                actions.selectRelative(e, -1);
                break;
            case 40: //Down
                if (isLastItem) break;
                actions.selectRelative(e, 1);
                break;
            case 36: //Home
                if (isFirstItem) break;
                actions.selectRelative(e, 0, originValues.FirstItem);
                break;
            case 35: //End
                if (isLastItem) break;
                actions.selectRelative(e, -0, originValues.LastItem);
                break;
            case 13: //Enter
                const activeValue = rowValues[activeIndex];
                if (!e.ctrlKey && !e.shiftKey && selection.has(activeValue))
                    onItemsOpen(getSelectionArg(), true);
                else
                    actions.select(e, activeIndex);

                break;
            case 37: //Left
                if (isFirstPage) break;
                offsetPage(e, true);
                break;
            case 39: //Right
                if (isLastPage) break;
                offsetPage(e, false);
                break;
            default:
                return;
        }

        e.preventDefault();
        return false;
    }, [
        actions, options, onKeyDown, placeholderShown,
        activeIndex, selection, rowValues, pageIndex, pageCount, //Redux props
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
        actions,
        Pagination,
        placeholderShown,
        table: props.table
    }

    const searchProps = {
        table: props.table,
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
