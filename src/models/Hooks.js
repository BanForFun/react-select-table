/* eslint-disable react-hooks/rules-of-hooks */
import { useMemo, useCallback } from 'react'
import {
  createDispatchHook,
  createSelectorHook,
  createStoreHook
} from 'react-redux'
import { bindActionCreators } from 'redux'

export default function Hooks(options, actions, selectors) {
  // Create redux hooks
  const { context } = options
  const _useSelector = createSelectorHook(context)
  const _useDispatch = createDispatchHook(context)
  const _useStore = createStoreHook(context)

  const { getStateSlice } = selectors

  this.useSelector = (selector, ...args) =>
    _useSelector((state) => selector(getStateSlice(state), ...args))

  this.useSelectorGetter = (selector) => {
    const store = _useStore()
    return useCallback(
      (...args) => selector(getStateSlice(store.getState()), ...args),
      [selector, store]
    )
  }

  this.useActions = () => {
    const dispatch = _useDispatch()
    return useMemo(() => bindActionCreators(actions, dispatch), [dispatch])
  }
}
