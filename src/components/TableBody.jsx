import React from 'react'
import * as setUtils from '../utils/setUtils'
import * as dlMapUtils from '../utils/doublyLinkedMapUtils'
import ColGroup from './ColGroup'
import TableRow from './TableRow'
import { DragModes } from '../constants/enums'

/**
 * Child of {@link Components.ResizingContainer}.
 *
 * @name Components.TableBody
 * @type {React.FC}
 */
function TableBody(props) {
  const {
    dragMode,
    selectionRectRef,
    tableBodyRef,
    showPlaceholder,
    getRowClassName,
    contextMenu,
    utils: { hooks, selectors },

    ...rowCommonProps
  } = props

  const { columns, name } = props

  const rowKeys = hooks.useSelector(s => s.rowKeys)
  const selected = hooks.useSelector(s => s.selected)
  const items = hooks.useSelector(s => s.items)
  const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex)

  const renderRow = (rowKey, rowIndex) => {
    const rowItem = dlMapUtils.getItem(items, rowKey)
    const rowSelected = setUtils.hasItem(selected, rowKey)

    const rowProps = {
      ...rowCommonProps,
      item: rowItem,
      itemKey: rowKey,
      index: rowIndex,
      key: `row_${props.name}_${rowKey}`,
      active: rowIndex === activeRowIndex,
      selected: rowSelected,
      className: getRowClassName(rowItem),
      gestureTarget: rowIndex,
      onDualTap: contextMenu
    }

    return <TableRow {...rowProps} />
  }

  return <div className='rst-body' ref={tableBodyRef}>
    <table>
      <ColGroup name={name} columns={columns} />
      <tbody className='rst-rows'>
        {!showPlaceholder && rowKeys.map(renderRow)}
      </tbody>
    </table>
    {dragMode === DragModes.Select &&
      <div className='rst-dragSelection' ref={selectionRectRef} />}
  </div>
}

export default TableBody
