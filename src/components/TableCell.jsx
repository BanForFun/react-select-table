import _ from 'lodash'
import classNames from 'classnames'
import React from 'react'

/**
 * Child of {@link Components.TableRow}.
 *
 * @name Components.TableCell
 * @type {React.FC}
 */
const TableCell = ({ render, rowItem, rowIndex, path, isHeader }) => {
  const options = {
    className: null
  }

  const defaultContent = path ? _.get(rowItem, path) : rowIndex + 1
  const content = render(defaultContent, rowItem, options)
  const CellType = isHeader ? 'th' : 'td'

  return <CellType
    className={classNames('rst-cell', options.className)}
  >{content}</CellType>
}

export default TableCell
