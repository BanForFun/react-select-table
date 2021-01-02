import React, {Fragment, useEffect} from 'react';
import {defaultEvents} from "../utils/tableUtils";
import ScrollingContainer from "./ScrollingContainer";
import PaginationContainer from "./PaginationContainer";

function Root(props) {
    const {
        loadingIndicator,
        Error,
        Pagination, //PaginationContainer
        onContextMenu,
        onSelectionChange,
        ...scrollingProps
    } = props;

    const {
        storage: { utils, events }
    } = props;

    const isLoading = utils.useSelector(s => s.isLoading);
    const error = utils.useSelector(s => s.error);

    const actions = utils.useActions();

    //Register redux event handlers
    for (let event in defaultEvents) {
        const handler = props[event];

        useEffect(() => {
            events[event] = handler;
        }, [handler, events]);
    }

    //Render placeholder
    function renderPlaceholder() {
        if (isLoading)
            return loadingIndicator;
        else if (error)
            return <Error error={error}/>;

        return null;
    }

    const placeholder = renderPlaceholder();

    //Set props
    Object.assign(scrollingProps, {
        actions,
        placeholder
    });

    const paginationProps = {
        actions,
        Pagination,
        storage: props.storage
    }

    //Render table
    return <Fragment>
        <ScrollingContainer {...scrollingProps} />
        {!placeholder && <PaginationContainer {...paginationProps} />}
    </Fragment>
}

export default React.memo(Root);
