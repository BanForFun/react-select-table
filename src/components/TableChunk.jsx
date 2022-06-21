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
    utils: { options, hooks },
    getRowClassName,
    rowValues,
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
  const items = hooks.useSelector(s => s.items)
  const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex)

  const { widths, resizingIndex } = useContext(ColumnGroupContext)

  const chunkRef = useRef()

  useLayoutEffect(() => {
    const chunk = chunkRef.current
    loadChunk(chunk)

    const observer = chunkIntersectionObserver.current
    observer.observe(chunk)
    return () => observer.unobserve(chunk)
  }, [chunkIntersectionObserver, rowValues])

  const isClipped = useMemo(() => {
    if (resizingIndex == null) return false

    // Intersection shouldn't change when resizing starts, as getBoundingClientRect is used to set the widths.
    const chunk = chunkRef.current
    return chunk && !chunk.classList.contains(VisibleChunkClass)
  }, [resizingIndex])

  const renderRow = (value, index) => {
    const data = items[value]
    index += chunkIndexOffset

    const rowProps = {
      ...rowCommonProps,
      data,
      value,
      index,
      key: `row_${props.name}_${value}`,
      active: index === activeRowIndex,
      selected: !!selected[value],
      className: getRowClassName(data)
    }

    return <TableRow {...rowProps} />
  }

  return <table className='rst-chunk' ref={chunkRef}>
    <ColGroup {...{ name, columns, widths, isClipped }} />
    <tbody className='rst-rows'>{rowValues.map(renderRow)}</tbody>
  </table>
}

export default React.memo(TableChunk)
