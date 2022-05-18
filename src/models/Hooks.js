/* eslint-disable react-hooks/rules-of-hooks */
import { useMemo, useCallback } from 'react'
import {
  createDispatchHook,
  createSelectorHook,
  createStoreHook
} from 'react-redux'
import { bindActionCreators } from 'redux'

export default function Hooks(utils) {
  // Create redux hooks
  const { context } = utils.options
  const _useSelector = createSelectorHook(context)
  const _useDispatch = createDispatchHook(context)
  const _useStore = createStoreHook(context)

  this.useSelector = (selector, ...args) =>
    _useSelector((state) => selector(utils.getTableState(state), ...args))

  this.useSelectorGetter = (selector) => {
    const store = _useStore()
    return useCallback(
      (...args) => selector(utils.getTableState(store.getState()), ...args),
      [selector, store]
    )
  }

  this.useActions = () => {
    const dispatch = _useDispatch()
    return useMemo(() => bindActionCreators(utils.actions, dispatch), [dispatch])
  }
}
