import React, { useContext, useLayoutEffect, useMemo, useRef } from 'react'
import TableRow from './TableRow'
import ColumnGroupContext from '../context/ColumnGroup'
import ColGroup from './ColGroup'
import * as selectors from '../selectors/selectors'

export const VisibleChunkClass = 'rst-visible'

export function loadChunk(chunk) {
  chunk.classList.add(VisibleChunkClass)
}

function TableChunk(props) {
  const {
    utils: { options, hooks, getItemValue },
    getRowClassName,
    rows,
    index,
    chunkIntersectionObserver,
    clipPath,
    getContainerVisibleBounds,

    ...rowCommonProps
  } = props

  const {
    columns,
    name
  } = props

  const chunkIndexOffset = index * options.chunkSize
  const selected = hooks.useSelector(s => s.selected)
  const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex)

  const { widths, resizingIndex } = useContext(ColumnGroupContext)

  const chunkRef = useRef()

  useLayoutEffect(() => {
    const chunk = chunkRef.current
    loadChunk(chunk)

    const observer = chunkIntersectionObserver.current
    observer.observe(chunk)
    return () => observer.unobserve(chunk)
  }, [chunkIntersectionObserver, rows])

  const isClipped = useMemo(() => {
    if (resizingIndex == null) return false

    // Intersection shouldn't change when resizing starts, as getBoundingClientRect is used to set the widths.
    const chunk = chunkRef.current
    return chunk && !chunk.classList.contains(VisibleChunkClass)
  }, [resizingIndex])

  const renderRow = (rowData, rowIndex) => {
    const rowValue = getItemValue(rowData)
    rowIndex += chunkIndexOffset

    const rowProps = {
      ...rowCommonProps,
      key: `row_${props.name}_${rowValue}`,
      data: rowData,
      value: rowValue,
      index: rowIndex,
      active: rowIndex === activeRowIndex,
      selected: !!selected[rowValue],
      className: getRowClassName(rowData)
    }

    return <TableRow {...rowProps} />
  }

  return <table className='rst-chunk' ref={chunkRef}>
    <ColGroup {...{ name, columns, widths, isClipped }} />
    <tbody className='rst-rows'>{rows.map(renderRow)}</tbody>
  </table>
}

export default React.memo(TableChunk)
