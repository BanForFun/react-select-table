import _ from 'lodash'

export const getFlagAttribute = flagName => 'data-is-' + flagName
export const getFlagAttributes = flagNames => _.mapValues(flagNames, getFlagAttribute)

export const flagAttributeSelector = attribute => `[${attribute}]`

export function dataAttributeFlags(flags) {
  const attributes = _.mapKeys(flags, (enabled, name) => getFlagAttribute(name))
  return _.mapValues(attributes, enabled => enabled ? '' : undefined)
}
