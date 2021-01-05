import React, {useRef, useEffect, useCallback} from 'react';
import {defaultEvents} from "../utils/tableUtils";
import ScrollingContainer from "./ScrollingContainer";
import PaginationContainer from "./PaginationContainer";
import classNames from "classnames";
import useGetSelectionArg from "../hooks/useGetSelectionArg";
import {matchModifiers} from "../utils/eventUtils";

function Root(props) {
    const {
        Pagination, //PaginationContainer
        onContextMenu,
        onSelectionChange,
        onKeyDown,
        containerRef,
        id,
        className,
        ...scrollingProps
    } = props;

    const {
        storage: { utils, events, options },
        onItemsOpen
    } = props;

    const actions = utils.useActions();

    const tableBodyRef = useRef();

    //Register redux event handlers
    for (let event in defaultEvents) {
        const handler = props[event];

        useEffect(() => {
            events[event] = handler;
        }, [handler, events]);
    }

    //Keyboard selection
    const activeIndex = utils.useSelector(t => t.activeIndex);
    const itemCount = utils.useSelector(t => t.tableItems.length);

    const page = utils.useSelector(t => t.page);
    const pageCount = utils.useSelector(utils.getPageCount);

    const showPlaceholder = utils.useSelector(t => t.isLoading || !!t.error);

    const selectIndex = useCallback((e, index) => {
        if (matchModifiers(e, true, false))
            actions.setActive(index);
        else
            actions.select(index, e.ctrlKey, e.shiftKey);

        tableBodyRef.current.scrollToIndex(index);
    }, [actions]);

    const selectOffset = useCallback((e, offset) => {
        if (activeIndex == null) return;

        const newIndex = activeIndex + offset;
        if (!_.inRange(newIndex, itemCount)) return;

        selectIndex(e, newIndex);
    }, [selectIndex, activeIndex, itemCount]);

    const goToPage = useCallback(offset => {
        if (!pageCount) return;

        const newPage = page + offset;
        if (!_.inRange(newPage - 1, pageCount)) return;

        actions.goToPage(newPage);
    }, [page, pageCount, actions]);

    const getSelectionArg = useGetSelectionArg(utils);

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
                if (!matchModifiers(e, false, false)) {
                    actions.select(activeIndex, e.ctrlKey, e.shiftKey);
                    break;
                }

                onItemsOpen(getSelectionArg(), true);
                break;
            case 37: //Left
                goToPage(-1);
                break;
            case 39: //Right
                goToPage(1);
                break;
            default:
                onKeyDown(e, getSelectionArg());
                return;
        }

        e.preventDefault();
    }, [
        actions, options, showPlaceholder,
        itemCount, activeIndex,
        selectOffset, selectIndex, getSelectionArg, goToPage,
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
