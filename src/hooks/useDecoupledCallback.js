import { useRef, useEffect, useCallback } from 'react'

export default function useDecoupledCallback(callback) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback((...args) =>
    callbackRef.current(...args), [callbackRef])
}
