import React, { useRef, useEffect, useLayoutEffect } from 'react'
import _ from 'lodash'
import TableRow from './TableRow'
import ColGroup from './ColGroup'
import { px } from '../utils/tableUtils'

export function setChunkVisibility(chunk, visibility) {
  if (!visibility)
    // Save previous height, just before hiding
    chunk.style.height = px(chunk.offsetHeight)

  chunk.classList.toggle('rst-visible', visibility)
}

const TableChunk = props => {
  const {
    getRowClassName,
    rows,
    activeRowIndex,
    indexOffset,
    index,
    colWidths,
    chunkVisibilityRef,
    chunkIntersectionObserverRef: observerRef,

    ...rowCommonProps
  } = props

  const {
    columns,
    name
  } = props

  const chunkRef = useRef()

  useLayoutEffect(() => {
    // When chunk is updated, refresh its height
    setChunkVisibility(chunkRef.current, true)
  })

  useEffect(() => {
    // Set visibility according to chunkIntersectionObserver
    const visibility = chunkVisibilityRef.current[index]
    setChunkVisibility(chunkRef.current, visibility)
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
  if (prev.activeRowIndex !== next.activeRowIndex) return false

  const visibility = next.chunkVisibilityRef.current[next.index]
  if (!visibility) return true

  return _.isEqualWith(prev, next, (pv, nv, key, po) => {
    if (prev === po && key.endsWith('Ref')) return true
  })
}

export default React.memo(TableChunk, propsAreEqual)
