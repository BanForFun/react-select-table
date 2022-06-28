import React, { useContext } from 'react'
import { DragModes } from '../constants/enums'
import * as selectors from '../selectors/selectors'
import * as setUtils from '../utils/setUtils'
import * as dlMapUtils from '../utils/doublyLinkedMapUtils'
import ColumnGroupContext from '../context/ColumnGroup'
import ColGroup from './ColGroup'
import TableRow from './TableRow'

// Child of BodyContainer
function TableBody(props) {
  const {
    selectionRectRef,
    tableBodyRef,
    dragMode,
    showPlaceholder,
    getRowClassName,
    utils: { hooks },

    ...rowCommonProps
  } = props

  const { columns, name } = props

  const rowKeys = hooks.useSelector(s => s.rowKeys)
  const selected = hooks.useSelector(s => s.selected)
  const items = hooks.useSelector(s => s.items)
  const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex)

  const { widths } = useContext(ColumnGroupContext)

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
      className: getRowClassName(rowItem)
    }

    return <TableRow {...rowProps} />
  }

  return <div className='rst-body' ref={tableBodyRef}>
    <table>
      <ColGroup name={name} columns={columns} widths={widths} />
      <tbody className='rst-rows'>{rowKeys.map(renderRow)}</tbody>
    </table>
    {dragMode === DragModes.Select &&
      <div className='rst-dragSelection' ref={selectionRectRef} />}
  </div>
}

export default TableBody
