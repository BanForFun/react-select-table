import React, { useContext } from 'react'
import _ from 'lodash'
import TableBody from './TableBody'
import TableHead from './TableHead'
import ColumnGroupContext from '../context/ColumnGroup'
import { GestureTargets } from '../constants/enums'
import classNames from 'classnames'
import { pc } from '../utils/tableUtils'

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
  const columnStoppers = _.map(columnKeys, referenceKey => {
    const minWidthScale = options.minColumnWidth / widths[referenceKey]
    return <div className="rst-columnStopper rst-stopper"
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

  const containerStopperWidths = _.map(columnKeys, key =>
    containerWidth / widths[key] * options.minColumnWidth)

  const overflowing = containerWidth > 100
  const showClipStoppers = !!containerWidth && !overflowing // containerWidth is 0 when resizing the columns

  return <div className={classNames({
    'rst-clippingContainer': true,
    'rst-clipping': showClipStoppers
  })}>
    {showClipStoppers && columnStoppers}
    <div
      className='rst-resizingContainer'
      style={{
        width: pc(containerWidth),
        marginRight: showClipStoppers ? -_.max(containerStopperWidths) : 0
      }}
    >
      {!!containerWidth && (overflowing ? columnStoppers : _.map(columnKeys, (key, index) =>
        <div className="rst-containerStopper rst-stopper"
          data-col-key={key}
          key={`stopper-${key}`}
          style={{ width: containerStopperWidths[index] }}
        />
      ))}
      <TableHead {...headProps} />
      <TableBody {...bodyProps} />
    </div>
  </div>
}

export default ResizingContainer
