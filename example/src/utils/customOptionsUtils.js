import _ from 'lodash'

const customOptions = JSON.parse(sessionStorage.getItem('options'))

export function applyOptions(options) {
  _.defaults(options, customOptions)
  sessionStorage.setItem('options', JSON.stringify(options))
  window.location.reload()
}

export function getOptions() {
  return customOptions;
}
