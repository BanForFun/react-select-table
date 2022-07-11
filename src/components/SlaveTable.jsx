import React from 'react'
import { getTableUtils } from '../utils/tableUtils'
import Root from './Root'
import { slaveTablePropTypes } from '../types/TableProps'
import defaultTableProps from '../constants/defaultTableProps'

/**
 * Tables that share the same items, selection, etc. with a (Master) Table component,
 * but can differ in these ways:
 * - Visible columns
 * - Column widths
 * - Pagination component
 * - Class name of container and rows
 * - Loading indicator
 * - Empty placeholder
 *
 * @type {React.FC<import("../types/TableProps").SlaveTableProps>}
 */
const SlaveTable = React.forwardRef((props, ref) => {
  const { namespace, ...rootProps } = props

  return <Root
    {...rootProps}
    utils={getTableUtils(namespace)}
    containerRef={ref}
  />
})

//#region PropTypes

//#endregion

SlaveTable.propTypes = slaveTablePropTypes
SlaveTable.displayName = 'SlaveTable'
SlaveTable.defaultProps = defaultTableProps

export default SlaveTable
