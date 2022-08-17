import _ from 'lodash'
import { componentEventHandlersPropTypes } from '../types/TableProps'
import DefaultPagination from '../components/DefaultPagination'

export default {
  getRowClassName: () => '',
  className: '',
  dragSelectScrollFactor: 0.5,
  columnResizeScrollFactor: 0.2,
  errorComponent: 'span',
  paginationComponent: DefaultPagination,
  loadingIndicator: 'Loading...',
  emptyPlaceholder: 'No items',
  autoFocus: false,
  initColumnWidths: {},
  ..._.mapValues(componentEventHandlersPropTypes, _.constant(() => {}))
}
