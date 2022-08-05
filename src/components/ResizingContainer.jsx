import React, { useContext } from 'react'
import _ from 'lodash'
import TableBody from './TableBody'
import TableHead from './TableHead'
import ColumnGroupContext from '../context/ColumnGroup'
import { GestureTargets } from '../constants/enums'
import { pc } from '../utils/tableUtils'
import { dataAttributeFlags } from '../utils/dataAttributeUtils'

/**
 * Child of {@link Components.ScrollingContainer}.
 * Handles gestures
 *
 * @name Components.ResizingContainer
 * @type {React.FC}
 */
function ResizingContainer(props) {
  const {
    // HeadContainer props
    headColGroupRef,
    columnResizeStart,
    actions,

    // BodyContainer props
    getRowClassName,
    tableBodyRef,
    showPlaceholder,
    contextMenu,
    dragMode,
    selectionRectRef,

    ...commonProps
  } = props

  const {
    utils: { options },
    columns
  } = props

  //#region Event handlers

  //#endregion

  const headProps = {
    ...commonProps,
    headColGroupRef,
    actions,
    gestureTarget: GestureTargets.Header,
    onDualTap: contextMenu,

    columnResizeStart
  }

  const bodyProps = {
    ...commonProps,
    tableBodyRef,
    selectionRectRef,

    dragMode,
    showPlaceholder,
    getRowClassName,
    contextMenu
  }

  const { containerWidth, widths } = useContext(ColumnGroupContext)

  // The width of a hidden column must be distributed to the other columns, because the width of the container
  // must stay constant, as columns can be hidden using css while shrinking the container,
  // and we have no way to know when that happens (without javascript) in order to update the container width

  // The situation is easier when the table is not overflowing horizontally, as the width of the hidden column
  // can just go to the spacer with the container width staying constant

  // Stoppers control the size of the container before it overflows because a column reached its minimum size.
  // Can't use minWidth because we can't update it when a column gets hidden for the same reason as the container width.

  // Each column contributes a chunk to the stopper of every column, proportional to the column's size.
  // These chunks are also hidden together with the column, and thus the stoppers of all columns
  // shrink when a column is hidden to account for the width they gain when the width of the now hidden column,
  // gets distributed to the other columns (for an overflowing table)

  // For a non-overflowing table, there are two stages when shrinking the container.
  // In the first stage, when a column reaches its minimum size, the table stops shrinking (.rst-resizingContainer)
  // and the spacer starts being cropped (by .rst-clippingContainer)
  // In the second stage, when there is no spacer left, the clipping container also stops shrinking
  // and starts overflowing its parent (.rst-scrollingContainer) causing the horizontal scrollbar to appear

  const columnKeys = _.map(columns, 'key')
  const clippingStoppers = <div className="rst-stoppers">{
    _.map(columnKeys, referenceKey => {
      const minWidthScale = options.minColumnWidth / widths[referenceKey]
      return <div className="rst-clippingStopper"
        data-col-key={referenceKey}
        key={`stoppers-${referenceKey}`}
      >
        {_.map(columnKeys, key =>
          <div
            data-col-key={key}
            key={`stopper-${key}`}
            style={{ width: widths[key] * minWidthScale }}
          />)}
      </div>
    })
  }</div>

  const resizingStopperWidths = _.map(columnKeys, key =>
    containerWidth / widths[key] * options.minColumnWidth)

  const overflowing = containerWidth > 100
  const isResizing = !containerWidth
  const showClippingStoppers = !isResizing && !overflowing

  return <div
    className='rst-clippingContainer'
    {...dataAttributeFlags({ clipping: showClippingStoppers })}
  >
    {showClippingStoppers && clippingStoppers}
    <div
      className='rst-resizingContainer'
      style={{
        width: pc(containerWidth),
        marginRight: showClippingStoppers ? -_.max(resizingStopperWidths) : 0
      }}
    >
      {!isResizing && (overflowing ? clippingStoppers
        : <div className="rst-stoppers">{
          _.map(columnKeys, (key, index) =>
            <div className="rst-resizingStopper rst-stopper"
              data-col-key={key}
              key={`stopper-${key}`}
              style={{ width: resizingStopperWidths[index] }}
            />)
        }</div>
      )}
      <TableHead {...headProps} />
      <TableBody {...bodyProps} />
    </div>
  </div>
}

export default ResizingContainer
