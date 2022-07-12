import DefaultPagination from '../components/DefaultPagination'

export default {
  getRowClassName: () => null,
  dragSelectScrollFactor: 0.5,
  columnResizeScrollFactor: 0.2,
  errorComponent: 'span',
  paginationComponent: DefaultPagination,
  loadingIndicator: 'Loading...',
  emptyPlaceholder: 'No items',
  autoFocus: false,
  initColumnWidths: {}
}
