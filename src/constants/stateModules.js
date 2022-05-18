function * flag(power) {
  while (true) yield Math.pow(2, power)
}

const flags = flag(0)

export const Items = flags.next()
export const Selection = flags.next() | Items
export const Filter = flags.next()
export const Search = flags.next()
export const SortOrder = flags.next()
export const Pagination = flags.next()
