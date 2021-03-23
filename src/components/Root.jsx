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

    const virtualActiveIndex = utils.useSelector(s => s.virtualActiveIndex);
    const pageCount = utils.useSelector(selectors.getPageCount);
    const itemCount = utils.useSelector(s => s.tableItems.length);
    const selection = utils.useSelector(s => s.selection);
    const pageIndex = utils.useSelector(s => s.pageIndex);
    const pageSize = utils.useSelector(s => s.pageSize);
    const showPlaceholder = utils.useSelector(s => s.isLoading || !!s.error);

    const getSelectionArg = utils.useSelectorGetter(selectors.getSelectionArg);
    const getItemValue = utils.useSelectorGetter(selectors.getItemValue);

    const selectIndex = useCallback((e, index) => {
        if (matchModifiers(e, true, false))
            actions.setActive(index);
        else
            actions.select(index, true, e.ctrlKey, e.shiftKey);
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

        const itemIndex = newIndex * pageSize;
        if (matchModifiers(e, false, false))
            actions.goToPage(newIndex);
        else
            selectIndex(e, itemIndex);
    }, [
        pageIndex, pageCount, pageSize,
        actions, selectIndex
    ]);

    const searchItem = useCallback(e => {

    })

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
                const value = getItemValue(virtualActiveIndex);
                if (matchModifiers(e, false, false) && selection.has(value))
                    onItemsOpen(getSelectionArg(), true);
                else
                    actions.select(virtualActiveIndex, true, e.ctrlKey, e.shiftKey);

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
        actions, options, //Component props
        showPlaceholder, itemCount, virtualActiveIndex, selection, //Redux props
        getSelectionArg, getItemValue, //Redux selectors
        selectOffset, selectIndex, offsetPage, //Component methods
        onKeyDown, onItemsOpen //Event handlers
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
