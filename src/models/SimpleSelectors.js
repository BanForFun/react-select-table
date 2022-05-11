import _ from 'lodash'
import SelectionSelectors from './simpleSelectors/SelectionSelectors'
import PaginationSelectors from './simpleSelectors/PaginationSelectors'

export default function SimpleSelectors(options) {
  const pagination = new PaginationSelectors()
  const selection = new SelectionSelectors(pagination)

  const getStateSlice = (state) =>
    _.getOrSource(state, options.statePath)

  return {
    ...selection,
    ...pagination,
    getStateSlice
  }
}
