/* eslint-disable react-hooks/rules-of-hooks */
import { useMemo, useCallback } from 'react'
import {
  createDispatchHook,
  createSelectorHook,
  createStoreHook
} from 'react-redux'
import { bindActionCreators } from 'redux'

/**
 * @namespace HooksTypes
 */

/**
 * @typedef {import('./Actions').ActionsTypes.Class} HooksTypes.Actions
 */
/**
 * @typedef {import('../store/store').StoreTypes.State} HooksTypes.State
 */

/**
 * Returns the table's slice of the state
 *
 * @callback HooksTypes.getState
 * @returns {HooksTypes.State} The table state
 */

export default class Hooks {
  constructor(options, selectors, actions) {
    /** @private */
    this.actions = actions
    /** @private */
    this.selectors = selectors

    const { context } = options
    /**
     * The normal useSelector hook, bound to {@link Options.context}
     *
     * @type {import('react-redux').useSelector}
     */
    this.useRootSelector = createSelectorHook(context)
    /**
     * The normal useDispatch hook, bound to {@link Options.context}
     *
     * @type {import('react-redux').useDispatch}
     */
    this.useDispatch = createDispatchHook(context)
    /**
     * The normal useStore hook, bound to {@link Options.context}
     *
     * @type {import('react-redux').useStore}
     */
    this.useStore = createStoreHook(context)
  }

  /**
   * Like normal useSelector, but the table's slice of the state is passed to the selector, instead of the root state
   *
   * @type {import('react-redux').TypedUseSelectorHook<HooksTypes.State>}
   */
  useSelector = (selector, equalityFn) =>
    this.useRootSelector((state) => selector(this.selectors.getTableState(state)), equalityFn)

  /**
   * Returns a getter for the table's slice of the state
   *
   * @function
   * @returns {HooksTypes.getState} The getter for the table state
   */
  useGetState = () => {
    const store = this.useStore()
    return useCallback(() => this.selectors.getTableState(store.getState()), [store])
  }

  /**
   * Returns the actions wrapped into dispatch calls using
   * {@link https://redux.js.org/api/bindactioncreators|bindActionCreators}
   *
   * @function
   * @returns {HooksTypes.Actions} The actions, but calling an action dispatches it automatically
   */
  useActions = () => {
    const dispatch = this.useDispatch()
    return useMemo(() => bindActionCreators(this.actions, dispatch), [dispatch])
  }
}
