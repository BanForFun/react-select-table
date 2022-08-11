import { detailedDiff } from 'deep-object-diff'
import { comparePropsDeep } from './memoUtils'

console.warn('The debug utils are loaded')

export function debugPropsEqual(prev, next) {
  const equal = comparePropsDeep(prev, next)
  if (!equal)
    console.log(detailedDiff(prev, next))

  return equal
}
