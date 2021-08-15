import React, {useRef, useEffect, useCallback, useMemo} from 'react';
import ScrollingContainer from "./ScrollingContainer";
import PaginationContainer from "./PaginationWrapper";
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

    const pageIndex = hooks.useSelector(selectors.getPageIndex);
    const pageCount = hooks.useSelector(selectors.getPageCount);
    const activeValue = hooks.useSelector(selectors.getActiveValue);
    const activeIndex = hooks.useSelector(s => s.activeIndex);
    const pageSize = hooks.useSelector(s => s.pageSize);
    const selection = hooks.useSelector(s => s.selection);
    const isLoading = hooks.useSelector(s => s.isLoading);
    const error = hooks.useSelector(s => s.error);
    const itemCount = hooks.useSelector(s => s.visibleItemCount);

    const getSelectionArg = hooks.useSelectorGetter(selectors.getSelectionArg);

    const isEmpty = !itemCount;
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

    const select = useCallback((e, index) => {
        if (e.ctrlKey && !e.shiftKey)
            return actions.setActive(e, index);

        return actions.select(e, index);
    }, [actions]);

    const handleShortcuts = useCallback(e => {
        if (placeholderShown) return false;
        if (onKeyDown(e, getSelectionArg()) === false) return false;

        const isPageFirst = pageIndex === 0;
        const isPageLast = pageIndex === pageCount - 1;
        const isActiveFirst = activeIndex === 0;
        const isActiveLast = activeIndex === itemCount - 1;

        switch (e.keyCode) {
            case 38: //Up
                if (!isActiveFirst) select(e, activeIndex - 1);
                break;
            case 40: //Down
                if (!isActiveLast) select(e, activeIndex + 1);
                break;
            case 37: //Left
                if (!isPageFirst) select(e, activeIndex - pageSize);
                break;
            case 39: //Right
                if (!isPageLast) select(e, Math.min(activeIndex + pageSize, itemCount - 1));
                break;
            case 36: //Home
                if (!isActiveFirst) select(e, 0);
                break;
            case 35: //End
                if (!isActiveLast) select(e, itemCount - 1);
                break;
            case 13: //Enter
                if (!e.ctrlKey && !e.shiftKey && selection.has(activeValue))
                    onItemsOpen(getSelectionArg(), true);
                else
                    actions.select(e, activeIndex);

                break;
            case 65: //A
                if (e.ctrlKey && !e.shiftKey && options.multiSelect)
                    actions.selectAll();
                break;
            default:
                return;
        }

        e.preventDefault();
        return false;
    }, [
        actions, options, onKeyDown, placeholderShown,
        activeIndex, itemCount, selection, activeValue, pageSize, //Redux props
        getSelectionArg, //Redux selectors
        select, //Component methods
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
