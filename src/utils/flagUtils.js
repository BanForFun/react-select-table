import _ from 'lodash'

export function flagGenerator() {
  let power = 0
  return () => Math.pow(2, power++)
}

export function hasFlag(flags, flag) {
  return (flags & flag) === flag
}

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

export function removeFlag(flags, flag, allFlags = [flag]) {
  const dependant = getDependant(allFlags, flag)
  return _.reduce(dependant, removeSingleFlag, flags)
}

export function toggleFlag(flags, flag, enabled, allFlags = [flag]) {
  if (enabled) return addFlag(flags, flag)
  return removeFlag(flags, flag, allFlags)
}
