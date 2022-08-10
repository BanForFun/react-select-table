import React, { useMemo } from 'react'
import * as setUtils from '../utils/setUtils'
import * as dlMapUtils from '../utils/doublyLinkedMapUtils'
import ColGroup from './ColGroup'
import { DragModes } from '../constants/enums'
import _ from 'lodash'
import ChunkObserver from './ChunkObserver'

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
    utils: { hooks, selectors, options },

    ...chunkCommonProps
  } = props

  const { columns, name } = props

  const rowKeys = hooks.useSelector(s => s.rowKeys)
  const selected = hooks.useSelector(s => s.selected)
  const items = hooks.useSelector(s => s.items)
  const activeRowIndex = hooks.useSelector(selectors.getActiveRowIndex)

  const keyChunks = useMemo(() => _.chunk(rowKeys, options.chunkSize),
    [rowKeys, options])

  const renderChunk = (keys, chunkIndex) => {
    const chunkIndexOffset = chunkIndex * options.chunkSize
    const rows = keys.map((key, rowIndex) => {
      const index = chunkIndexOffset + rowIndex
      return {
        key,
        index,
        data: dlMapUtils.getItem(items, key),
        selected: setUtils.hasItem(selected, key),
        active: index === activeRowIndex
      }
    })

    return <ChunkObserver
      rows={rows}
      key={`chunk_${props.name}_${chunkIndex}`}
      {...chunkCommonProps}
    />
  }

  return <div className='rst-body' ref={tableBodyRef}>
    <table>
      <ColGroup name={name} columns={columns} />
      {!showPlaceholder && keyChunks.map(renderChunk)}
    </table>
    {dragMode === DragModes.Select &&
      <div className='rst-dragSelection' ref={selectionRectRef} />}
  </div>
}

export default TableBody
