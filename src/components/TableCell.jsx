import _ from 'lodash'
import React from 'react'

/**
 * Child of {@link Components.TableRow}.
 *
 * @name Components.TableCell
 * @type {React.FC}
 */
const TableCell = ({ render, rowItem, rowIndex, path, isHeader }) => {
  const options = {
    className: ''
  }

  const defaultContent = path ? _.get(rowItem, path) : rowIndex + 1
  const content = render(defaultContent, rowItem, options)
  const CellType = isHeader ? 'th' : 'td'

  return <CellType
    className={'rst-cell ' + options.className}
  >{content}</CellType>
}

export default TableCell
