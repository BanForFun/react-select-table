import React from 'react'
import { getTableUtils } from '../utils/tableUtils'
import Root from './Root'
import { tablePropTypes, reduxEventHandlersPropTypes } from '../types/TableProps'
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
  for (const handlerName in reduxEventHandlersPropTypes) {
    eventHandlers[handlerName] = rootProps[handlerName]
    delete rootProps[handlerName]
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
