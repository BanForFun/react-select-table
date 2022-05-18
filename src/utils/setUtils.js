export function removeItem(set, name) {
  return delete set[name]
}

export function addItem(set, name) {
  set[name] = true
}

export function toggleItem(set, name, exists) {
  const action = exists ? addItem : removeItem
  action(set, name)
}
