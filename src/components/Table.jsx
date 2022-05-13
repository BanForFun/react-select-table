import React, { useEffect } from 'react'
import DefaultPagination from './DefaultPagination'
import { tableUtils } from '../utils/tableUtils'
import Root from './Root'
import { defaultEventHandlers } from '../models/EventRaisers'
import tablePropTypes from '../types/TableProps'

/**
 * Table Component
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
  for (const handlerName in eventHandlers) {
    const handler = props[handlerName]
    delete rootProps[handlerName]

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      eventHandlers[handlerName] = handler
    }, [handler, eventHandlers, handlerName])
  }

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
  autoFocus: false,
  ...defaultEventHandlers
}

export default Table
