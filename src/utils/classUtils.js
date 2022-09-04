export function bindPrototypeMethods(instance) {
  const propertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))

  for (const name of propertyNames) {
    if (name === 'constructor') continue
    if (typeof instance[name] !== 'function') continue

    instance[name] = instance[name].bind(instance)
  }
}
