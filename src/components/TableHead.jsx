import React, { useMemo, useCallback, useContext } from 'react'
import _ from 'lodash'
import TableHeader from './TableHeader'
import ColumnGroupContext from '../context/ColumnGroup'
import { GestureTargets } from '../constants/enums'

// Child of HeadContainer
function TableHead(props) {
  const {
    columns,
    name,
    dragMode,
    setGestureTarget,
    targetTouchStart,
    tableHeaderRowRef,
    ...commonHeaderProps
  } = props

  const {
    columnResizeStart,
    utils: { hooks, options }
  } = props

  const sortAscending = hooks.useSelector(s => s.sortAscending)

  const sorting = useMemo(() => {
    let priority = 0

    return {
      orders: _.mapValues(sortAscending, ascending => ({ ascending, priority: ++priority })),
      maxPriority: priority
    }
  }, [sortAscending])

  const { widths, resizingIndex, widthUnit } = useContext(ColumnGroupContext)

  const getHeaderProps = (column, index) => {
    const { path, title, key } = column
    const sortOrder = sorting.orders[path]

    return {
      ...commonHeaderProps,
      path,
      title,
      index,
      width: widthUnit(widths[key]),
      isResizable: !options.constantWidth || index < columns.length - 1,
      isResizing: resizingIndex === index,
      sortAscending: sortOrder?.ascending,
      sortPriority: sortOrder?.priority,
      showPriority: sorting.maxPriority > 1
    }
  }

  const handleSpacerPointerDown = useCallback(e => {
    if (!e.isPrimary) return
    columnResizeStart(e.clientX, e.clientY, e.pointerId, columns.length - 1)
  }, [columnResizeStart, columns])

  return <div
    className='rst-head'
    onPointerDownCapture={() => setGestureTarget(GestureTargets.Header)}
    onTouchStart={e => targetTouchStart(e, true)}
  >
    <table>
      <thead>
        <tr className='rst-row' ref={tableHeaderRowRef}>
          {columns.map((col, idx) =>
            <TableHeader key={`header_${name}_${col.key}`} {...getHeaderProps(col, idx)} />)}

          <th className='rst-spacer'>
            {/* Second column resizer for last header, to ensure that the full width of the resizer
                        is visible even when the spacer is fully collapsed */}
            {!options.constantWidth &&
              <div className='rst-columnResizer' onPointerDown={handleSpacerPointerDown} />}
          </th>
        </tr>
      </thead>
    </table>
  </div>
}

export default TableHead
