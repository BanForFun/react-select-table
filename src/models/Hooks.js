/* eslint-disable react-hooks/rules-of-hooks */
import { useMemo, useCallback } from 'react'
import {
  createDispatchHook,
  createSelectorHook,
  createStoreHook
} from 'react-redux'
import { bindActionCreators } from 'redux'

export default function Hooks(options, actions, getTableState) {
  // Create redux hooks
  const { context } = options
  const _useSelector = createSelectorHook(context)
  const _useDispatch = createDispatchHook(context)
  const _useStore = createStoreHook(context)

  this.useSelector = (selector, ...args) =>
    _useSelector((state) => selector(getTableState(state), ...args))

  this.useSelectorGetter = (selector) => {
    const store = _useStore()
    return useCallback(
      (...args) => selector(getTableState(store.getState()), ...args),
      [selector, store]
    )
  }

  this.useActions = () => {
    const dispatch = _useDispatch()
    return useMemo(() => bindActionCreators(actions, dispatch), [dispatch])
  }
}
