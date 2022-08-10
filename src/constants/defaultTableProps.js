import _ from 'lodash'
import { componentEventHandlersPropTypes, reduxEventHandlersPropTypes } from '../types/TableProps'
import { noopEventHandler } from '../models/Events'
import DefaultPagination from '../components/DefaultPagination'

const getNoopEventHandler = _.constant(noopEventHandler)

export default {
  getRowClassName: () => '',
  dragSelectScrollFactor: 0.5,
  columnResizeScrollFactor: 0.2,
  errorComponent: 'span',
  paginationComponent: DefaultPagination,
  loadingIndicator: 'Loading...',
  emptyPlaceholder: 'No items',
  autoFocus: false,
  initColumnWidths: {},
  ..._.mapValues(reduxEventHandlersPropTypes, getNoopEventHandler),
  ..._.mapValues(componentEventHandlersPropTypes, getNoopEventHandler)
}
