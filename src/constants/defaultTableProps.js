import DefaultPagination from '../components/DefaultPagination'

export default {
  getRowClassName: () => null,
  className: 'rst-default',
  dragSelectScrollFactor: 0.5,
  columnResizeScrollFactor: 0.2,
  errorComponent: 'span',
  paginationComponent: DefaultPagination,
  loadingIndicator: null,
  emptyPlaceholder: null,
  autoFocus: false,
  initColumnWidths: {}
}
