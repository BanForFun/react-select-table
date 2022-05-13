import React, { useCallback, useEffect } from 'react'
import DefaultPagination from './DefaultPagination'
import { tableUtils } from '../utils/tableUtils'
import Root from './Root'
import tablePropTypes, { eventHandlerNames } from '../types/TableProps'

/**
 * Table Component
 *
 * @type {React.FC<import("../types/TableProps").TableProps>}
 */
const Table = React.forwardRef((props, ref) => {
  const {
    name, namespace,
    ...rootProps
  } = props

  const utils = tableUtils[namespace]

  // Register redux event handlers
  const { eventHandlers } = utils
  for (const handlerName of eventHandlerNames) {
    const handler = props[handlerName]
    delete rootProps[handlerName]

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      eventHandlers[handlerName] = handler
    }, [handler, eventHandlers, handlerName])
  }

  rootProps.hasEventListener = useCallback(name =>
    eventHandlers[name] != null, [eventHandlers])

  return <Root
    {...rootProps}
    utils={utils.public}
    containerRef={ref}
    name={name ?? namespace}
  />
})

//#region PropTypes

//#endregion

Table.propTypes = tablePropTypes
Table.displayName = 'Table'

Table.defaultProps = {
  getRowClassName: () => null,
  className: 'rst-default',
  dragSelectScrollFactor: 0.5,
  columnResizeScrollFactor: 0.2,
  errorComponent: 'span',
  paginationComponent: DefaultPagination,
  loadingIndicator: null,
  emptyPlaceholder: null,
  autoFocus: false
}

export default Table
