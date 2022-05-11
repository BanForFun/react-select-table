export default class SelectionSelectors {
  constructor(paginationSelectors) {
    this._pgSelectors = paginationSelectors
  }

  getActiveRowIndex = (state) =>
    state.activeIndex % this._pgSelectors.getPageSize(state)

  getActiveValue = (state) =>
    state.rowValues[this.getActiveRowIndex(state)]

  getSelected = (state, rowIndex) =>
    state.selection.has(state.rowValues[rowIndex])
}
