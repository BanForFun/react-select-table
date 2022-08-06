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
 * @typedef {Hooks} HooksTypes.HooksClass
 */

/**
 * @typedef {import('./Actions').ActionsTypes.ActionsClass} ActionsClass
 */

/**
 * @typedef {import('../store/store').StoreTypes.State} StateType
 */

/**
 * Returns the table's slice of the state
 *
 * @callback HooksTypes.getState
 * @returns {StateType} The table state
 */

/**
 * Returns a property from the table state
 *
 * @template Selected
 * @callback HooksTypes.selector
 * @param {StateType} state The table state
 * @returns {Selected} A property from the state
 */

/**
 * Should return true if a render is deemed necessary because of a state property change
 *
 * @template Selected
 * @callback HooksTypes.equalityFn
 * @param {Selected} a The previous value
 * @param {Selected} b The current value
 * @returns {boolean} Whether the values are considered equal
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
   * @template Selected
   * @param {HooksTypes.selector<Selected>} selector The selector
   * @param {HooksTypes.equalityFn<Selected>} [equalityFn] The equality comparator
   * @returns {Selected} The value returned from the selector
   */
  useSelector(selector, equalityFn) {
    return this.useRootSelector((state) => selector(this.selectors.getTableState(state)), equalityFn)
  }

  /**
   * Returns a getter for the table's slice of the state
   *
   * @returns {HooksTypes.getState} The getter for the table state
   */
  useGetState() {
    const store = this.useStore()
    return useCallback(() => this.selectors.getTableState(store.getState()), [store])
  }

  /**
   * Returns the actions wrapped into dispatch calls using
   * {@link https://redux.js.org/api/bindactioncreators|bindActionCreators}
   *
   * @param {?object} metadata An object to be assigned to every action
   * @returns {ActionsClass} The actions, but calling an action dispatches it automatically
   */
  useActions(metadata = null) {
    const dispatch = this.useDispatch()
    return useMemo(() => {
      const dispatchWithExtra = action => dispatch(Object.assign(action, metadata))
      return bindActionCreators(this.actions, dispatchWithExtra)
    }, [dispatch, metadata])
  }
}
