import { useCallback, useEffect } from 'react'

/**
 * Saves and restores a state value from session storage
 *
 * @template Value
 * @param key
 * @param {Value} defaultValue
 * @returns {{ function(Value):void, initialValue: Value}}
 */
export default function usePersistState(key, defaultValue) {
  const restoredValue = JSON.parse(sessionStorage.getItem(key)) ?? defaultValue

  const saveValue = useCallback(value => {
    sessionStorage.setItem(key, JSON.stringify(value))
  }, [key])

  function useSaveValue(value) {
    useEffect(() => saveValue(value), [value])
  }

  return { restoredValue, saveValue, useSaveValue }
}
