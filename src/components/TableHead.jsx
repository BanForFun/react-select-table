import React, { useMemo, useCallback, useContext } from 'react'
import _ from 'lodash'
import TableHeader from './TableHeader'
import ColumnGroupContext from '../context/ColumnGroup'
import ColGroup from './ColGroup'
import classNames from 'classnames'
import withGestures from '../hoc/withGestures'

/**
 * Child of {@link Components.ResizingContainer}.
 *
 * @name Components.TableHead
 * @type {React.FC}
 */
function TableHead(props) {
  const {
    handleGesturePointerDownCapture,
    handleGestureTouchStart,
    columns,
    name,
    headColGroupRef,
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

  const { resizingIndex } = useContext(ColumnGroupContext)

  const getHeaderProps = (column, index) => {
    const { path, title } = column
    const sortOrder = sorting.orders[path]

    return {
      ...commonHeaderProps,
      path,
      title,
      index,
      isResizing: resizingIndex === index,
      sortAscending: sortOrder?.ascending,
      sortPriority: sortOrder?.priority,
      showPriority: sorting.maxPriority > 1
    }
  }

  const handleSpacerPointerDown = useCallback(e => {
    if (!e.isPrimary) return
    columnResizeStart(e.clientX, e.clientY, e.pointerId, columns.length)
  }, [columnResizeStart, columns])

  return <div
    className='rst-head'
    onPointerDownCapture={handleGesturePointerDownCapture}
    onTouchStart={handleGestureTouchStart}
  >
    <table>
      <ColGroup name={name} columns={columns} ref={headColGroupRef} />
      <thead>
        <tr className='rst-row'>
          {columns.map((col, idx) =>
            <TableHeader key={`header_${name}_${col.key}`} {...getHeaderProps(col, idx)} />)}

          <th className='rst-endCap'/>

          <th className={classNames({
            'rst-spacer': true,
            'rst-resizing': resizingIndex === columns.length
          })}>
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

export default withGestures(TableHead)
