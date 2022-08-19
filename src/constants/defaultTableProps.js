import _ from 'lodash'
import { componentEventHandlersPropTypes } from '../types/TableProps'
import DefaultPagination from '../components/DefaultPagination'
import { getNoopHandlers, noopEventHandler } from '../models/Events'

const defaultProps = {
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
  ...getNoopHandlers(),
  ..._.mapValues(componentEventHandlersPropTypes, _.constant(noopEventHandler))
}

export default defaultProps
