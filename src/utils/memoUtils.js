import _ from 'lodash'

export function comparePropsDeep(prev, next) {
  return _.isEqualWith(prev, next, (pv, nv, key, po) => {
    // Don't compare refs at the top level
    if (po === prev && key.endsWith('Ref')) return true
  })
}
