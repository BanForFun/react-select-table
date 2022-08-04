import _ from 'lodash'

export function dataAttributeFlags(flags) {
  const attributes = _.mapKeys(flags, (enabled, name) => 'data-' + name)
  return _.mapValues(attributes, enabled => enabled ? '' : undefined)
}
