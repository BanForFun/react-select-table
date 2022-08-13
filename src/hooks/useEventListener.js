import useDecoupledCallback from './useDecoupledCallback'
import { useCallback } from 'react'
import useObjectMemo from './useObjectMemo'

export const activeListenerOptions = { passive: false }
const defaultOptions = {}

export default function useEventListener(type, handler, options = defaultOptions) {
  const decoupledHandler = useDecoupledCallback(handler)

  const add = useCallback(element =>
    element.addEventListener(type, decoupledHandler, options),
  [decoupledHandler, type, options])

  const remove = useCallback(element =>
    element.removeEventListener(type, decoupledHandler, options),
  [decoupledHandler, type, options])

  return useObjectMemo({ add, remove })
}
