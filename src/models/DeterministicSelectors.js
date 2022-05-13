import _ from 'lodash'

export default function DeterministicSelectors(options) {
  this.getPageSize = (state) =>
    state.pageSize || state.visibleItemCount

  this.getPageCount = (state) =>
    Math.ceil(state.visibleItemCount / this.getPageSize(state))

  this.getItemPageIndex = (state, itemIndex) =>
    Math.floor(itemIndex / this.getPageSize(state))

  this.getPageIndex = (state) =>
    this.getItemPageIndex(state, state.activeIndex)

  this.getPageIndexOffset = (state) =>
    this.getPageIndex(state) * state.pageSize

  this.getActiveRowIndex = (state) =>
    state.activeIndex % this.getPageSize(state)

  this.getActiveValue = (state) =>
    state.rowValues[this.getActiveRowIndex(state)]

  this.getSelected = (state, rowIndex) =>
    state.selection.has(state.rowValues[rowIndex])

  this.getStateSlice = (state) =>
    _.getOrSource(state, options.statePath)
}
