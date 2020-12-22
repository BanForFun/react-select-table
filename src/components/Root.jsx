import styles from "../index.scss";

import React, {Fragment, useEffect, useMemo} from 'react';
import {bindActionCreators} from "redux";
import {defaultEvents} from "../utils/optionUtils";
import {useDispatch} from "react-redux";
import ScrollingContainer from "./ScrollingContainer";
import PaginationContainer from "./PaginationContainer";

function Root(props) {
    const {
        loadingIndicator,
        emptyPlaceholder,
        Error,
        Pagination, //PaginationContainer
        onContextMenu,
        onSelectionChange,
        ...scrollingProps
    } = props;

    const { utils, events } = props.options;

    const isLoading = utils.useSelector(s => s.isLoading);
    const error = utils.useSelector(s => s.error);
    const noItems = utils.useSelector(s => !s.tableItems.length);

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
    let placeholder;
    let placeholderEvents = null;

    if (isLoading)
        placeholder = loadingIndicator;
    else if (error)
        placeholder = <Error error={error}/>;
    else if (noItems) {
        placeholder = emptyPlaceholder;
        placeholderEvents = {
            onContextMenu: () => dispatchers.contextMenu(null),
            onKeyDown: e => props.onKeyDown(e, utils.getEmptySelectionArg())
        }
    }

    if (placeholder !== undefined)
        return <div className={styles.placeholder}
                    tabIndex="0"
                    {...placeholderEvents}
        >{placeholder}</div>


    //Set props
    scrollingProps.dispatchers = dispatchers;

    const paginationProps = {
        dispatchers,
        Pagination,
        options: props.options
    }

    //Render table
    return <Fragment>
        <ScrollingContainer {...scrollingProps} />
        <PaginationContainer {...paginationProps} />
    </Fragment>
}

export default React.memo(Root);
