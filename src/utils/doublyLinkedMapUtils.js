import { debugSymbols } from './debugUtils'

const symbols = {
  nextValue: Symbol('Next value'),
  prevValue: Symbol('Previous value'),
  headValue: Symbol('Head value'),
  tailValue: Symbol('Tail value')
}
debugSymbols(symbols)

export function * valueIterator(
  map, forward = true,
  originValue = forward ? map[symbols.headValue] : map[symbols.tailValue]
) {
  let value = originValue
  while (value != null) {
    yield value
    value = map[value][forward ? symbols.nextValue : symbols.prevValue]
  }
}

function setNextItem(map, value, nextValue) {
  const { [nextValue]: nextItem, [value]: item } = map

  if (nextItem)
    nextItem[symbols.prevValue] = value
  else
    map[symbols.tailValue] = value

  if (item)
    item[symbols.nextValue] = nextValue
  else
    map[symbols.headValue] = nextValue
}

function linkItem(map, prevValue, value, nextValue) {
  setNextItem(map, prevValue, value)
  setNextItem(map, value, nextValue)
}

export function sortAndLinkItems(map, values, valueComparator) {
  values = values.sort(valueComparator)
  const linkedValues = valueIterator(map)

  let linkedValueNext = linkedValues.next()
  let valueIndex = 0

  while (!linkedValueNext.done && valueIndex < values.length) {
    const value = values[valueIndex]
    const linkedValue = linkedValueNext.value

    if (valueComparator(linkedValue, value) < 0) {
      const linkedItem = map[linkedValue]
      linkItem(map, linkedItem[symbols.prevValue], value, linkedValue)
      valueIndex++
    } else linkedValueNext = linkedValues.next()
  }

  for (; valueIndex < values.length; valueIndex++)
    linkItem(map, map[symbols.tailValue], values[valueIndex], null)
}

export function removeItem(map, value) {
  const item = map[value]
  if (!item) return false

  setNextItem(map, item[symbols.prevValue], item[symbols.nextValue])
  return true
}

export function addUnlinkedItem(map, value, item) {
  const replaced = removeItem(map, value)
  map[value] = item

  return replaced
}

export function sortItems(map, valueComparator) {
  const values = [...valueIterator(map)].sort(valueComparator)

  let prevValue = null
  for (const value of values) {
    setNextItem(map, prevValue, value)
    prevValue = value
  }

  setNextItem(map, prevValue, null)
}
