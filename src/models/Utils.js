import Hooks from './Hooks'
import Actions from './Actions'
import Events from './Events'
import Selectors from './Selectors'
import { getOptions } from '../utils/optionsUtils'

/**
 * @namespace UtilsTypes
 */

/**
 * @typedef {Utils} UtilsTypes.UtilsClass
 */

export default class Utils {
  constructor(namespace, options) {
    this.options = getOptions(options)
    this.actions = new Actions(namespace)
    this.selectors = new Selectors(this.options)
    this.events = new Events(this.selectors)
    this.hooks = new Hooks(this.options, this.selectors, this.actions)
  }
}
