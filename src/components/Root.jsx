import React, {Fragment, useEffect, useMemo} from 'react';
import {bindActionCreators} from "redux";
import {defaultEvents} from "../utils/storageUtils";
import {useDispatch} from "react-redux";
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

    const dispatch = useDispatch();

    //Create action dispatchers
    const dispatchers = useMemo(() =>
        bindActionCreators(utils.actions, dispatch),
        [utils, dispatch]
    );

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
        dispatchers,
        placeholder
    });

    const paginationProps = {
        dispatchers,
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
