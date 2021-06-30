import React, {useRef, useEffect, useCallback} from 'react';
import _ from "lodash";
import {defaultEvents} from "../utils/tableUtils";
import ScrollingContainer from "./ScrollingContainer";
import PaginationContainer from "./PaginationContainer";
import {matchModifiers} from "../utils/eventUtils";
import {relativePos, specialValues} from "../store/table";
import {getPageCount} from "../selectors/paginationSelectors";

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
        table: { utils, events, options, selectors },
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

    const activeValue = utils.useSelector(s => s.activeValue);
    const pageCount = utils.useSelector(getPageCount);
    const rowValues = utils.useSelector(selectors.getRowValues);
    const selection = utils.useSelector(s => s.selection);
    const pageIndex = utils.useSelector(s => s.pageIndex);
    const showPlaceholder = utils.useSelector(s => s.isLoading || !!s.error);

    const getSelectionArg = utils.useSelectorGetter(selectors.getSelectionArg);

    const offsetPage = useCallback((e, prev) => {
        if (matchModifiers(e, false, false)) {
            const relPos = prev ? relativePos.PREV : relativePos.NEXT;
            actions.goToPageRelative(relPos);
        } else {
            const origin = prev ? specialValues.FIRST_ROW : specialValues.LAST_ROW;
            const offset = prev ? -1 : 1;
            actions.selectRelative(e, offset, origin);
        }
    }, [actions]);

    const handleShortcuts = useCallback(e => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pageCount - 1;

        const isFirstItem = isFirstPage && activeValue === _.first(rowValues);
        const isLastItem = isLastPage && activeValue === _.last(rowValues);

        switch (e.keyCode) {
            case 65: //A
                if (matchModifiers(e, true, false) && options.multiSelect)
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
                actions.selectRelative(e, 0, specialValues.FIRST_ITEM);
                break;
            case 35: //End
                if (isLastItem) break;
                actions.selectRelative(e, -0, specialValues.LAST_ITEM);
                break;
            case 13: //Enter
                if (matchModifiers(e, false, false) && selection.has(activeValue))
                    onItemsOpen(getSelectionArg(), true);
                else
                    actions.select(e, activeValue);

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
    }, [
        actions, options, //Component props
        activeValue, selection, rowValues, pageIndex, pageCount, //Redux props
        getSelectionArg, //Redux selectors
        offsetPage, //Component methods
        onItemsOpen //Event handlers
    ])

    const handleKeyDown = useCallback(e => {
        if (showPlaceholder) return;
        onKeyDown(e, getSelectionArg());

        if (matchModifiers(e, false) && e.key.length === 1)
            actions.search(e.key);

        handleShortcuts(e);
    }, [
        showPlaceholder, actions,
        handleShortcuts,
        onKeyDown,
        getSelectionArg
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
        table: props.table,
        itemContainerRef: props.itemContainerRef
    }

    return <div
        tabIndex="0"
        id={id}
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className={"rst-container " + className}
    >
        <ScrollingContainer {...scrollingProps} />
        <PaginationContainer {...paginationProps} />
    </div>
}

export default React.memo(Root);
