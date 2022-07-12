import { useEffect, useState } from 'react'
import useSessionValue from './useSessionValue'

export default function useSessionState(key, defaultValue) {
  const [restoredValue, saveValue] = useSessionValue(key, defaultValue)

  const [value, setValue] = useState(restoredValue)
  useEffect(() => {
    saveValue(value)
  }, [saveValue, value])


  return [value, setValue]
}
