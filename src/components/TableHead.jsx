import React, { useMemo, useContext } from 'react'
import _ from 'lodash'
import TableHeader from './TableHeader'
import ColumnGroupContext from '../context/ColumnGroup'
import ColGroup from './ColGroup'
import GestureTarget from '../models/GestureTarget'
import { GestureTargetTypes } from '../constants/enums'
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
    headRowRef,
    ...commonHeaderProps
  } = props

  const {
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

  const renderHeader = (column, index) => {
    const { path, title } = column
    const sortOrder = sorting.orders[path]

    return <TableHeader {...commonHeaderProps}
      path={path}
      title={title}
      key={`header_${name}_${column.key}`}
      className='rst-header'
      gestureTarget={GestureTarget(GestureTargetTypes.Header, index)}
      isResizable={!!index}
      isResizing={resizingIndex === index}
      sortAscending={sortOrder?.ascending}
      sortPriority={sortOrder?.priority}
      showPriority={sorting.maxPriority > 1}
    />
  }

  return <div
    className='rst-head'
    onPointerDownCapture={handleGesturePointerDownCapture}
    onTouchStart={handleGestureTouchStart}
  >
    <table>
      <ColGroup name={name} columns={columns} ref={headColGroupRef} />
      <thead>
        <tr className='rst-row' ref={headRowRef}>
          {columns.map(renderHeader)}
          <th className='rst-endCap'/>
          <TableHeader {...commonHeaderProps}
            path=''
            title=''
            gestureTarget={null}
            className='rst-spacer'
            isResizable={!options.constantWidth}
            sortAscending={true}
            sortPriority={-1}
            showPriority={false}
          />
        </tr>
      </thead>
    </table>
  </div>
}

export default withGestures(TableHead)
