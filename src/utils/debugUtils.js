import _ from 'lodash'
import { detailedDiff } from 'deep-object-diff'

export function debugPropsEqual(prev, next) {
  const equal = _.isEqual(prev, next)
  if (!equal)
    console.log(detailedDiff(prev, next))

  return equal
}
