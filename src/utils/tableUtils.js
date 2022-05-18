import Utils from '../models/Utils'

export const px = n => `${n}px`
export const pc = n => `${n}%`

const tableUtils = {}
export function createTableUtils(namespace, options) {
  return (tableUtils[namespace] = new Utils(namespace, options))
}

/**
 * @param {string} namespace The namespace passed to createTable
 * @returns {Utils} Utilities for the specific reducer
 */
export function getTableUtils(namespace) {
  return tableUtils[namespace]
}
