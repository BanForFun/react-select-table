import React, { useEffect } from 'react'
import { getTableUtils } from '../utils/tableUtils'
import Root from './Root'
import { tablePropTypes, reduxEventHandlerNames } from '../types/TableProps'
import { handlersSymbol } from '../models/Events'
import defaultTableProps from '../constants/defaultTableProps'

/**
 * Table component
 *
 * @name Components.Table
 * @type {React.FC<import("../types/TableProps").TableProps>}
 */
const Table = React.forwardRef((props, ref) => {
  const { namespace, ...rootProps } = props

  const utils = getTableUtils(namespace)

  // Register redux event handlers
  const eventHandlers = utils.events[handlersSymbol]
  for (const handlerName of reduxEventHandlerNames) {
    const handler = props[handlerName]
    delete rootProps[handlerName]

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      eventHandlers[handlerName] = handler
    }, [handler, eventHandlers, handlerName])
  }

  return <Root
    {...rootProps}
    utils={utils}
    containerRef={ref}
    name={namespace}
  />
})

//#region PropTypes

//#endregion

Table.propTypes = tablePropTypes
Table.displayName = 'Table'
Table.defaultProps = defaultTableProps

export default Table
