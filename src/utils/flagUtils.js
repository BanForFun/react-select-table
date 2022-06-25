export function flagGenerator() {
  let power = 0
  return () => Math.pow(2, power++)
}

export function hasFlag(value, flag) {
  return (value & flag) === flag
}
