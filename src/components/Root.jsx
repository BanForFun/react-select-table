import React, {Fragment, useEffect} from 'react';
import {defaultEvents} from "../utils/tableUtils";
import ScrollingContainer from "./ScrollingContainer";
import PaginationContainer from "./PaginationContainer";

function Root(props) {
    const {
        Pagination, //PaginationContainer
        onContextMenu,
        onSelectionChange,
        ...scrollingProps
    } = props;

    const {
        storage: { utils, events }
    } = props;

    const actions = utils.useActions();

    const showPagination = utils.useSelector(s => !s.isLoading && !s.error);

    //Register redux event handlers
    for (let event in defaultEvents) {
        const handler = props[event];

        useEffect(() => {
            events[event] = handler;
        }, [handler, events]);
    }

    //Set props
    Object.assign(scrollingProps, {
        actions
    });

    const paginationProps = {
        actions,
        Pagination,
        storage: props.storage
    }

    //Render table
    return <Fragment>
        <ScrollingContainer {...scrollingProps} />
        {showPagination && <PaginationContainer {...paginationProps} />}
    </Fragment>
}

export default React.memo(Root);
