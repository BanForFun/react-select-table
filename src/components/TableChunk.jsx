import React, { useRef, useEffect, useLayoutEffect } from 'react'
import _ from 'lodash'
import TableRow from './TableRow'
import ColGroup from './ColGroup'

export const VisibleChunkClass = 'rst-visible'

const TableChunk = props => {
  const {
    getRowClassName,
    rows,
    activeRowIndex,
    indexOffset,
    chunkIntersectionObserverRef: observerRef,

    ...rowCommonProps
  } = props

  const {
    columns,
    name
  } = props

  const chunkRef = useRef()

  useLayoutEffect(() => {
    const chunk = chunkRef.current
    chunk.classList.add(VisibleChunkClass)
    console.log('Rendered', indexOffset)
  })

  useEffect(() => {
    const observer = observerRef.current
    const chunk = chunkRef.current
    observer.observe(chunk)
    console.log('Observing', indexOffset)
    return () => observer.unobserve(chunk)
  })

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

  return <table className='rst-chunk' ref={chunkRef}>
    <ColGroup {...{ name, columns }} />
    <tbody className='rst-rows'>{rows.map(renderRow)}</tbody>
  </table>
}

const propsAreEqual = (prev, next) => _.isEqualWith(prev, next, (pv, nv, key, po) => {
  if (prev === po && key.endsWith('Ref')) return true
})

export default React.memo(TableChunk, propsAreEqual)
