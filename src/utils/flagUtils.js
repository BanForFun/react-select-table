import _ from 'lodash'

/**
 * Returns a function that returns the next power of 2 every time it is called
 *
 * @returns {function(): number} A function that returns the next power of 2
 */
export function flagGenerator() {
  let power = 0
  return () => Math.pow(2, power++)
}

/**
 * Checks whether a given binary flag is enabled
 *
 * @param {number} flags The set of flags
 * @param {number} flag The flag to check for
 * @returns {boolean} True if the flag is enabled
 */
export function hasFlag(flags, flag) {
  return (flags & flag) === flag
}

/**
 * Returns the given set of flags, after enabling the given flag
 *
 * @param {number} flags The set of flags on which to enable the given flag on
 * @param {number} flag The flag to enable
 * @returns {number} The set of flags, after enabling the flag
 */
export function addFlag(flags, flag) {
  return flags | flag
}

function removeSingleFlag(flags, flag) {
  return flags & ~flag
}

function isolateFlag(flag) {
  return 1 << 31 - Math.clz32(flag)
}

function getDependant(flags, flag) {
  return _.filter(flags, f => hasFlag(f, flag)).map(isolateFlag)
}

/**
 * Returns the given number, after disabling the given flag and all other dependant flags
 *
 * @param {number} flags The set of flags on which to disable the given flag
 * @param {number} flag The flag to disable
 * @param {number[]|Object<string,number>} [allFlags] The collection of flags that the flag to disable is a part of
 * @returns {number} The set of flags after disabling the given flag and all others that depend on it
 */
export function removeFlag(flags, flag, allFlags = [flag]) {
  const dependant = getDependant(allFlags, flag)
  return _.reduce(dependant, removeSingleFlag, flags)
}

/**
 * Enables or disables a flag
 *
 * @param {number} flags The set of flags on which to enable/disable the given flag
 * @param {number} flag The flag to enable/disable
 * @param {boolean} enabled True to enable the flag, false to disable it
 * @param {number[]|Object<string,number>} [allFlags] The collection of flags that the flag to enable/disable is a part of
 * @returns {number} The set of flags after enabling/disabling the given flag
 */
export function toggleFlag(flags, flag, enabled, allFlags = [flag]) {
  if (enabled) return addFlag(flags, flag)
  return removeFlag(flags, flag, allFlags)
}
