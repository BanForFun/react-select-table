import React, { useRef, useEffect, useLayoutEffect } from 'react'
import _ from 'lodash'
import TableRow from './TableRow'
import ColGroup from './ColGroup'
import { px } from '../utils/tableUtils'

export function setChunkVisible(chunk, visible) {
  chunk.style.height = visible ? 'auto' : px(chunk.offsetHeight)
  chunk.classList.toggle('rst-hidden', !visible)
  delete chunk.dataset.forcedReload
}

const TableChunk = props => {
  const {
    getRowClassName,
    rows,
    activeRowIndex,
    indexOffset,
    index,
    colWidths,
    visible,
    chunkIntersectionObserverRef: observerRef,

    ...rowCommonProps
  } = props

  const {
    columns,
    name
  } = props

  const chunkRef = useRef()

  console.log('Rendered chunk', index, visible)

  useLayoutEffect(() => {
    if (visible) return

    const chunk = chunkRef.current
    setChunkVisible(chunkRef.current, true)
    chunk.dataset.forcedReload = true
  })

  useEffect(() => {
    if (visible) return

    const chunk = chunkRef.current
    if (!chunk.dataset.forcedReload) return
    setChunkVisible(chunk, false)
  })

  useEffect(() => {
    const observer = observerRef.current
    const chunk = chunkRef.current
    observer.observe(chunk)
    return () => observer.unobserve(chunk)
  }, [observerRef])

  const renderRow = (row, rowIndex) => {
    const rowProps = {
      ...rowCommonProps,
      item: row.item,
      itemKey: row.key,
      index: indexOffset + rowIndex,
      key: `row_${props.name}_${row.key}`,
      active: rowIndex === activeRowIndex,
      selected: row.selected,
      className: getRowClassName(row.item)
    }

    return <TableRow {...rowProps} />
  }

  return <table className='rst-chunk' ref={chunkRef} data-index={index}>
    <ColGroup name={name} columns={columns} widths={colWidths} />
    <tbody className='rst-rows'>{rows.map(renderRow)}</tbody>
  </table>
}

function propsAreEqual(prev, next) {
  if (prev.activeRowIndex === next.activeRowIndex && !next.visible) return true

  return _.isEqualWith(prev, next, (pv, nv, key, po) => {
    if (prev !== po) return

    if (key === 'visible') return true
    if (key.endsWith('Ref')) return true
  })
}

export default React.memo(TableChunk, propsAreEqual)
