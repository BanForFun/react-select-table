import _ from 'lodash'
import React from 'react'

function TableCell({ render, rowItem, rowIndex, path, isHeader }) {
  const options = {
    className: null
  }

  const defaultContent = path ? _.get(rowItem, path) : rowIndex
  const content = render(defaultContent, rowItem, options)
  const CellType = isHeader ? 'th' : 'td'

  return <CellType className={options.className}>{content}</CellType>
}

export default React.memo(TableCell)
