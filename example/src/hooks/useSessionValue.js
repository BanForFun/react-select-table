import { useCallback } from 'react'

export default function useSessionValue(key, defaultValue) {
  const restoredValue = JSON.parse(sessionStorage.getItem(key)) ?? defaultValue

  const saveValue = useCallback(value => {
    sessionStorage.setItem(key, JSON.stringify(value))
  }, [key])

  return [restoredValue, saveValue]
}
