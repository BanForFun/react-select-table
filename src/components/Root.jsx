import React, {useRef, useEffect, useCallback} from 'react';
import {defaultEvents} from "../utils/tableUtils";
import ScrollingContainer from "./ScrollingContainer";
import PaginationContainer from "./PaginationContainer";
import classNames from "classnames";
import {matchModifiers} from "../utils/eventUtils";

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
        ...scrollingProps
    } = props;

    const {
        storage: { utils, events, options, selectors },
        onItemsOpen
    } = props;

    const actions = utils.useActions();

    const tableBodyRef = useRef();

    useEffect(() => {
        if (!autoFocus) return;
        containerRef.current.focus();
    }, []);

    //Register redux event handlers
    for (let event in defaultEvents) {
        const handler = props[event];

        useEffect(() => {
            events[event] = handler;
        }, [handler, events]);
    }

    const virtualActiveIndex = utils.useSelector(selectors.getVirtualActiveIndex);
    const itemCount = utils.useSelector(t => t.tableItems.length);
    const selection = utils.useSelector(t => t.selection);
    const pageIndex = utils.useSelector(t => t.pageIndex);
    const pageSize = utils.useSelector(t => t.pageSize);
    const pageCount = utils.useSelector(selectors.getPageCount);
    const showPlaceholder = utils.useSelector(t => t.isLoading || !!t.error);

    const getSelectionArg = utils.useSelectorGetter(selectors.getSelectionArg);

    const selectIndex = useCallback((e, index) => {
        if (matchModifiers(e, true, false))
            actions.setActive(index);
        else
            actions.select(index, e.ctrlKey, e.shiftKey);

        tableBodyRef.current.scrollToIndex(index);
    }, [actions]);

    const selectOffset = useCallback((e, offset) => {
        const index = virtualActiveIndex + offset;
        if (!_.inRange(index, itemCount)) return;

        selectIndex(e, index);
    }, [
        selectIndex,
        virtualActiveIndex, itemCount
    ]);

    const offsetPage = useCallback((e, offset) => {
        if (!pageCount) return;

        const newIndex = pageIndex + offset;
        if (!_.inRange(newIndex, pageCount)) return;

        const firstIndex = newIndex * pageSize;

        if (e.shiftKey)
            actions.select(firstIndex, e.ctrlKey, e.shiftKey);
        else
            actions.goToPage(newIndex);
    }, [pageIndex, pageCount, pageSize, actions]);

    const handleKeyDown = useCallback(e => {
        if (showPlaceholder) return;

        switch (e.keyCode) {
            case 65: //A
                if (matchModifiers(e, true, false) && options.multiSelect)
                    actions.selectAll();

                break;
            case 38: //Up
                selectOffset(e, -1);
                break;
            case 40: //Down
                selectOffset(e, 1);
                break;
            case 36: //Home
                selectIndex(e, 0);
                break;
            case 35: //End
                selectIndex(e, itemCount - 1);
                break;
            case 13: //Enter
                if (matchModifiers(e, false, false) && selection.has(virtualActiveIndex))
                    onItemsOpen(getSelectionArg(), true);
                else
                    actions.select(virtualActiveIndex, e.ctrlKey, e.shiftKey);

                break;
            case 37: //Left
                offsetPage(e, -1);
                break;
            case 39: //Right
                offsetPage(e, 1);
                break;
            default:
                return onKeyDown(e, getSelectionArg());
        }

        e.preventDefault();
    }, [
        actions, options, showPlaceholder,
        itemCount, virtualActiveIndex, selection,
        selectOffset, selectIndex, getSelectionArg, offsetPage,
        onKeyDown, onItemsOpen
    ]);

    //Scrolling container props
    Object.assign(scrollingProps, {
        actions,
        tableBodyRef,
        showPlaceholder
    });

    //Pagination container props
    const paginationProps = {
        actions,
        Pagination,
        showPlaceholder,
        storage: props.storage,
        itemContainerRef: props.itemContainerRef
    }

    return <div
        tabIndex="0"
        id={id}
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className={classNames("rst-container", className)}
    >
        <ScrollingContainer {...scrollingProps} />
        <PaginationContainer {...paginationProps} />
    </div>
}

export default React.memo(Root);
