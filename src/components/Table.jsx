import React, { useEffect } from 'react'
import { getTableUtils } from '../utils/tableUtils'
import Root from './Root'
import { tablePropTypes, reduxEventHandlersPropTypes } from '../types/TableProps'
import { handlersSymbol } from '../models/Events'
import defaultTableProps from '../constants/defaultTableProps'
import * as setUtils from '../utils/setUtils'

/**
 * Table component
 *
 * @name Components.Table
 * @type {React.FC<import("../types/TableProps").TableProps>}
 */
const Table = React.forwardRef((props, ref) => {
  const { namespace, ...rootProps } = props

  const utils = getTableUtils(namespace)
  const { hooks, selectors, events } = utils

  // Register redux event handlers
  for (const handlerName in reduxEventHandlersPropTypes) {
    events[handlersSymbol][handlerName] = rootProps[handlerName]
    delete rootProps[handlerName]
  }

  const getState = hooks.useGetState()
  const selection = hooks.useSelector(selectors.getSelection, setUtils.isEqual)
  useEffect(() => {
    events.selectionChange(getState())
  }, [selection, events, getState])

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
