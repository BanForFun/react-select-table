import _ from 'lodash'
import React from 'react'

function TableCell({ render, rowData, rowIndex, path, isHeader }) {
  const options = {
    className: null
  }

  const defaultContent = _.get(rowData, path, rowIndex)
  const content = render(defaultContent, rowData, options)
  const CellType = isHeader ? 'th' : 'td'

  return <CellType className={options.className}>{content}</CellType>
}

export default React.memo(TableCell)
